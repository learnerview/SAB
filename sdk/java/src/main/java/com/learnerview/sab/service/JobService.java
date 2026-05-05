package com.learnerview.sab.service;

import com.learnerview.sab.config.SabConfig;
import com.learnerview.sab.exception.SabException;
import com.learnerview.sab.model.*;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Service for handling job-related operations.
 */
@Slf4j
@RequiredArgsConstructor
public class JobService {
    private final WebClient webClient;
    private final SabConfig config;
    private final Tracer tracer;

    /**
     * Submits a new job for execution.
     *
     * @param jobRequest the job submission request
     * @return the submitted job response
     * @throws SabException if submission fails
     */
    public JobResponse submitJob(JobSubmissionRequest jobRequest) {
        return submitJobAsync(jobRequest).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 10));
    }

    /**
     * Submits a new job for execution asynchronously.
     *
     * @param jobRequest the job submission request
     * @return Mono containing the submitted job response
     */
    public Mono<JobResponse> submitJobAsync(JobSubmissionRequest jobRequest) {
        Span span = tracer.spanBuilder("sab.job.submit")
            .setAttribute("job.type", jobRequest.getJobType())
            .setAttribute("job.priority", jobRequest.getPriority().toString())
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.post()
                .uri("/api/v1/jobs")
                .bodyValue(jobRequest)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<JobResponse>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Job submission failed: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(response -> {
                    span.setAttribute("job.id", response.getJobId());
                    log.info("Successfully submitted job: {}", response.getJobId());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to submit job", error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30))
                    .doBeforeRetry(retrySignal ->
                        log.warn("Retrying job submission, attempt: {}", retrySignal.totalRetries() + 1)))
                .onErrorMap(error -> new SabException("Job submission failed", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Retrieves a job by its ID.
     *
     * @param jobId the job ID
     * @return the job response if found
     * @throws SabException if retrieval fails
     */
    public Optional<JobResponse> getJob(String jobId) {
        return getJobAsync(jobId).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Retrieves a job by its ID asynchronously.
     *
     * @param jobId the job ID
     * @return Mono containing the job response if found
     */
    public Mono<Optional<JobResponse>> getJobAsync(String jobId) {
        Span span = tracer.spanBuilder("sab.job.get")
            .setAttribute("job.id", jobId)
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/jobs/{jobId}", jobId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<JobResponse>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to get job: " + response.getMessage());
                    }
                    return Optional.ofNullable(response.getData());
                })
                .onErrorReturn(Optional.empty())
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Lists jobs for the current tenant.
     *
     * @return list of job responses
     * @throws SabException if listing fails
     */
    public List<JobResponse> listJobs() {
        return listJobsAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Lists jobs for the current tenant asynchronously.
     *
     * @return Mono containing list of job responses
     */
    public Mono<List<JobResponse>> listJobsAsync() {
        Span span = tracer.spanBuilder("sab.jobs.list").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/jobs")
                .retrieve()
                .bodyToMono(JobListResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to list jobs: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(jobs -> {
                    span.setAttribute("jobs.count", jobs.size());
                    log.info("Retrieved {} jobs", jobs.size());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to list jobs", error);
                })
                .onErrorMap(error -> new SabException("Failed to list jobs", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Cancels a job.
     *
     * @param jobId the job ID to cancel
     * @return true if cancellation was successful
     * @throws SabException if cancellation fails
     */
    public boolean cancelJob(String jobId) {
        return cancelJobAsync(jobId).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Cancels a job asynchronously.
     *
     * @param jobId the job ID to cancel
     * @return Mono containing true if cancellation was successful
     */
    public Mono<Boolean> cancelJobAsync(String jobId) {
        Span span = tracer.spanBuilder("sab.job.cancel")
            .setAttribute("job.id", jobId)
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.delete()
                .uri("/api/v1/jobs/{jobId}", jobId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Void>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to cancel job: " + response.getMessage());
                    }
                    return true;
                })
                .doOnSuccess(success -> {
                    span.setAttribute("job.the cancelled", true);
                    log.info("Successfully cancelled job: {}", jobId);
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to cancel job: {}", jobId, error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30)))
                .onErrorReturn(false)
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Gets job health information.
     *
     * @return job health information
     * @throws SabException if retrieval fails
     */
    public JobHealth getJobHealth() {
        return getJobHealthAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Gets job health information asynchronously.
     *
     * @return Mono containing job health information
     */
    public Mono<JobHealth> getJobHealthAsync() {
        Span span = tracer.spanBuilder("sab.jobs.health").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/jobs/health")
                .retrieve()
                .bodyToMono(JobHealthResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to get job health: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(health -> {
                    span.setAttribute("jobs.queued", health.getQueued());
                    span.setAttribute("jobs.running", health.getRunning());
                    log.info("Retrieved job health: queued={}, running={}", health.getQueued(), health.getRunning());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to get job health", error);
                })
                .onErrorMap(error -> new SabException("Failed to get job health", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Gets available job types.
     *
     * @return list of available job types
     * @throws SabException if retrieval fails
     */
    public List<String> getJobTypes() {
        return getJobTypesAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Gets available job types asynchronously.
     *
     * @return Mono containing list of available job types
     */
    public Mono<List<String>> getJobTypesAsync() {
        Span span = tracer.spanBuilder("sab.jobs.types").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/jobs/types")
                .retrieve()
                .bodyToMono(JobTypesResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to get job types: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(types -> {
                    span.setAttribute("jobs.types.count", types.size());
                    log.info("Retrieved {} job types", types.size());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to get job types", error);
                })
                .onErrorMap(error -> new SabException("Failed to get job types", error))
                .doFinally(signal -> span.end());
        }
    }
}
