package com.learnerview.sab.engine;

import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobStatus;
import com.learnerview.sab.core.ports.JobStateStore;
import com.learnerview.sab.core.ports.QueueAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Profile("worker")
@Slf4j
public class RetryPromoter {

    private final JobStateStore jobStateStore;
    private final QueueAdapter queueAdapter;

    public RetryPromoter(JobStateStore jobStateStore, QueueAdapter queueAdapter) {
        this.jobStateStore = jobStateStore;
        this.queueAdapter = queueAdapter;
    }

    @Scheduled(fixedDelayString = "${sab.worker.retry-promoter-interval-ms:1000}")
    public void promoteRetries() {
        for (Job job : jobStateStore.findDueRetries(Instant.now(), 100)) {
            Job queued = new Job(
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
                    job.startedAt(),
                    job.completedAt(),
                    job.attemptCount(),
                    job.maxAttempts(),
                    job.createdAt(),
                    Instant.now()
            );
            jobStateStore.save(queued);
            queueAdapter.enqueue(queued);
        }
    }
}


