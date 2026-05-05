package com.learnerview.sab.engine;

import com.learnerview.sab.core.domain.ExecutionPolicy;
import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobStatus;
import com.learnerview.sab.core.ports.ExecutionLogStore;
import com.learnerview.sab.core.ports.JobStateStore;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.observation.annotation.Observed;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;

@Service
@Slf4j
public class JobExecutor {

    private final JobStateStore jobStateStore;
    private final ExecutionLogStore logStore;
    private final RetryEvaluator retryEvaluator;
    private final MeterRegistry meterRegistry;

    public JobExecutor(JobStateStore jobStateStore,
                       ExecutionLogStore logStore,
                       RetryEvaluator retryEvaluator,
                       MeterRegistry meterRegistry) {
        this.jobStateStore = jobStateStore;
        this.logStore = logStore;
        this.retryEvaluator = retryEvaluator;
        this.meterRegistry = meterRegistry;
    }

    @CircuitBreaker(name = "externalHttpExecutor", fallbackMethod = "executeFallback")
    @Bulkhead(name = "externalHttpExecutor", type = Bulkhead.Type.SEMAPHORE, fallbackMethod = "executeFallback")
    @Observed(name = "sab.job.execute", contextualName = "job execute")
    public void execute(Job job) {
        long start = System.currentTimeMillis();
        try {
            ExecutionPolicy exec = job.execution();
            String type = exec != null && exec.type() != null ? exec.type().toUpperCase() : "HTTP";
            if (!"HTTP".equals(type)) {
                throw new IllegalArgumentException("Unsupported execution type: " + type);
            }

            String endpoint = exec != null ? exec.endpoint() : null;
            if (endpoint == null || endpoint.isBlank()) {
                throw new IllegalArgumentException("Missing execution endpoint for job " + job.id());
            }

            int timeoutSeconds = exec != null && exec.timeoutSeconds() != null ? exec.timeoutSeconds() : 10;
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(timeoutSeconds * 1000);
            requestFactory.setReadTimeout(timeoutSeconds * 1000);
            RestTemplate restTemplate = new RestTemplate(requestFactory);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(job.payload() != null ? job.payload() : "{}", headers);

            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, request, String.class);
            long durationMs = System.currentTimeMillis() - start;

            if (response.getStatusCode().is2xxSuccessful()) {
                Job completed = updateForSuccess(job, response.getBody());
                jobStateStore.save(completed);
                logStore.logSuccess(job.id(), job.attemptCount(), response.getBody(), durationMs);
                meterRegistry.counter("sab.jobs.completed", "tenant_id", job.tenantId()).increment();
                recordDuration(durationMs, job);
                return;
            }

            handleFailure(job, "HTTP " + response.getStatusCode().value(), durationMs);
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - start;
            handleFailure(job, e.getMessage() != null ? e.getMessage() : "Unknown error", durationMs);
        }
    }

    private void handleFailure(Job job, String errorMessage, long durationMs) {
        logStore.logFailure(job.id(), job.attemptCount(), errorMessage, durationMs);
        RetryDecision decision = retryEvaluator.evaluate(job, errorMessage);

        if (decision.shouldRetry()) {
            Job retry = updateForRetry(job, decision.nextRunAt());
            jobStateStore.save(retry);
            meterRegistry.counter("sab.jobs.retried", "tenant_id", job.tenantId()).increment();
        } else {
            Job failed = updateForDlq(job, errorMessage);
            jobStateStore.save(failed);
            meterRegistry.counter("sab.jobs.dlq", "tenant_id", job.tenantId()).increment();
        }
        meterRegistry.counter("sab.jobs.failed", "tenant_id", job.tenantId()).increment();
        recordDuration(durationMs, job);
    }

    private void recordDuration(long durationMs, Job job) {
        Timer.builder("sab.http.execution.duration")
                .tag("tenant_id", job.tenantId())
                .register(meterRegistry)
                .record(durationMs, java.util.concurrent.TimeUnit.MILLISECONDS);
    }

    private Job updateForSuccess(Job job, String result) {
        return new Job(
                job.id(),
                job.tenantId(),
                job.jobType(),
                job.idempotencyKey(),
                JobStatus.SUCCESS,
                job.priority(),
                job.payload(),
                result,
                job.execution(),
                job.nextRunAt(),
                null,
                null,
                null,
                job.startedAt(),
                Instant.now(),
                job.attemptCount(),
                job.maxAttempts(),
                job.createdAt(),
                Instant.now()
        );
    }

    private Job updateForRetry(Job job, Instant nextRunAt) {
        return new Job(
                job.id(),
                job.tenantId(),
                job.jobType(),
                job.idempotencyKey(),
                JobStatus.RETRY_SCHEDULED,
                job.priority(),
                job.payload(),
                job.result(),
                job.execution(),
                nextRunAt,
                null,
                null,
                null,
                job.startedAt(),
                null,
                job.attemptCount() + 1,
                job.maxAttempts(),
                job.createdAt(),
                Instant.now()
        );
    }

    private Job updateForDlq(Job job, String errorMessage) {
        return new Job(
                job.id(),
                job.tenantId(),
                job.jobType(),
                job.idempotencyKey(),
                JobStatus.DLQ,
                job.priority(),
                job.payload(),
                "Max retries exceeded: " + errorMessage,
                job.execution(),
                job.nextRunAt(),
                null,
                null,
                null,
                job.startedAt(),
                Instant.now(),
                job.attemptCount(),
                job.maxAttempts(),
                job.createdAt(),
                Instant.now()
        );
    }

    private void executeFallback(Job job, Throwable throwable) {
        String reason = throwable != null && throwable.getMessage() != null ? throwable.getMessage() : "Circuit breaker rejected execution";
        long durationMs = 0L;
        log.warn("Execution fallback for job {} tenant={} reason={}", job.id(), job.tenantId(), reason);
        handleFailure(job, reason, durationMs);
    }
}


