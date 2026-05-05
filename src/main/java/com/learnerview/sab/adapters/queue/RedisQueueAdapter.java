package com.learnerview.sab.adapters.queue;

import com.learnerview.sab.adapters.state.JobEntityMapper;
import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.QueueStats;
import com.learnerview.sab.core.ports.QueueAdapter;
import com.learnerview.sab.entity.JobEntity;
import com.learnerview.sab.repository.JobEntityRepository;
import com.learnerview.sab.repository.QueueRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
@Slf4j
public class RedisQueueAdapter implements QueueAdapter {

    private final QueueRepository queueRepository;
    private final JobEntityRepository jobRepository;
    private final JobEntityMapper mapper = new JobEntityMapper();

    public RedisQueueAdapter(QueueRepository queueRepository, JobEntityRepository jobRepository) {
        this.queueRepository = queueRepository;
        this.jobRepository = jobRepository;
    }

    @Override
    public void enqueue(Job job) {
        if (job == null) return;
        long scheduledAt = job.nextRunAt() != null ? job.nextRunAt().toEpochMilli() : Instant.now().toEpochMilli();
        queueRepository.enqueue(job.tenantId(), job.id(), com.learnerview.sab.model.JobPriority.valueOf(job.priority().name()), scheduledAt);
    }

    @Override
    public Optional<Job> dequeue(String tenantId, JobPriority priority) {
        Optional<String> claimed = queueRepository.claimNextReady(tenantId, com.learnerview.sab.model.JobPriority.valueOf(priority.name()));
        if (claimed.isEmpty()) return Optional.empty();

        Optional<JobEntity> job = jobRepository.findById(claimed.get());
        if (job.isEmpty()) {
            log.warn("Claimed job {} missing in DB", claimed.get());
            return Optional.empty();
        }

        if (!tenantId.equals(job.get().getProducer())) {
            log.warn("Claimed job {} tenant mismatch: expected {} got {}", claimed.get(), tenantId, job.get().getProducer());
            return Optional.empty();
        }

        return Optional.of(mapper.toDomain(job.get()));
    }

    @Override
    public void acknowledge(String jobId) {
        // No-op for Redis queue; state updates happen in JobStateStore.
    }

    @Override
    public void nack(String jobId, String reason) {
        jobRepository.findById(jobId).ifPresent(job -> {
            long scheduledAt = Instant.now().toEpochMilli();
            queueRepository.enqueue(job.getProducer(), jobId, job.getPriority(), scheduledAt);
            log.warn("Job {} nacked: {}", jobId, reason);
        });
    }

    @Override
    public QueueStats stats(String tenantId) {
        long high = queueRepository.queueSize(tenantId, com.learnerview.sab.model.JobPriority.HIGH);
        long normal = queueRepository.queueSize(tenantId, com.learnerview.sab.model.JobPriority.NORMAL);
        long low = queueRepository.queueSize(tenantId, com.learnerview.sab.model.JobPriority.LOW);

        long queued = jobRepository.countByProducerAndStatus(tenantId, com.learnerview.sab.model.JobStatus.QUEUED);
        long running = jobRepository.countByProducerAndStatus(tenantId, com.learnerview.sab.model.JobStatus.RUNNING);
        long success = jobRepository.countByProducerAndStatus(tenantId, com.learnerview.sab.model.JobStatus.SUCCESS);
        long failed = jobRepository.countByProducerAndStatus(tenantId, com.learnerview.sab.model.JobStatus.FAILED);
        long dlq = jobRepository.countByProducerAndStatus(tenantId, com.learnerview.sab.model.JobStatus.DLQ);

        return new QueueStats(high, normal, low, queued, running, success, failed, dlq);
    }

    @Override
    public java.util.List<String> listTenantIdsWithJobs() {
        return queueRepository.listTenantIdsWithJobs();
    }
}
