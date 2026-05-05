package com.learnerview.sab.engine;

import com.learnerview.sab.config.SchedulerProperties;
import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobStatus;
import com.learnerview.sab.core.ports.JobStateStore;
import com.learnerview.sab.core.ports.QueueAdapter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.observation.annotation.Observed;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Profile("worker")
@Slf4j
public class LeaseReaper {

    private final JobStateStore jobStateStore;
    private final QueueAdapter queueAdapter;
    private final SchedulerProperties props;
    private final MeterRegistry meterRegistry;

    public LeaseReaper(JobStateStore jobStateStore, QueueAdapter queueAdapter, SchedulerProperties props, MeterRegistry meterRegistry) {
        this.jobStateStore = jobStateStore;
        this.queueAdapter = queueAdapter;
        this.props = props;
        this.meterRegistry = meterRegistry;
    }

    @Scheduled(fixedDelayString = "${sab.worker.lease-reaper-interval-ms:5000}")
    @Observed(name = "sab.lease.reap", contextualName = "lease reap")
    public void recoverExpiredLeases() {
        try {
            for (Job job : jobStateStore.findExpiredLeases(java.time.Duration.ofSeconds(props.getWorker().getLeaseTimeoutSeconds()))) {
                log.warn("Recovering expired lease for job {} tenant={}", job.id(), job.tenantId());

                if (job.attemptCount() >= job.maxAttempts()) {
                    try {
                        jobStateStore.updateStatus(job.id(), JobStatus.DLQ, job.tenantId());
                        meterRegistry.counter("sab.jobs.dlq", "tenant_id", job.tenantId()).increment();
                        log.info("Moved job {} to DLQ (attempts={}/{})", job.id(), job.attemptCount(), job.maxAttempts());
                    } catch (Exception e) {
                        log.error("Failed to move job {} to DLQ: {}", job.id(), e.getMessage(), e);
                    }
                    continue;
                }

                Job reset = new Job(
                        job.id(),
                        job.tenantId(),
                        job.jobType(),
                        job.idempotencyKey(),
                        JobStatus.QUEUED,
                        job.priority(),
                        job.payload(),
                        job.result(),
                        job.execution(),
                        Instant.now(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        job.attemptCount(),
                        job.maxAttempts(),
                        job.createdAt(),
                        Instant.now()
                );

                try {
                    jobStateStore.save(reset);
                    queueAdapter.enqueue(reset);
                    meterRegistry.counter("sab.lease.reaper.recovered", "tenant_id", job.tenantId()).increment();
                    log.info("Recovered job {} and re-enqueued", job.id());
                } catch (Exception e) {
                    log.error("Failed to recover job {}: {}", job.id(), e.getMessage(), e);
                }
            }
        } catch (Exception outer) {
            log.error("LeaseReaper failed: {}", outer.getMessage(), outer);
        }
    }
}


