package com.learnerview.sab.engine;

import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.ports.JobStateStore;
import com.learnerview.sab.core.ports.QueueAdapter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
public class EngineService {

    private final QueueAdapter queueAdapter;
    private final JobStateStore jobStateStore;
    private final JobExecutor jobExecutor;
    private final MeterRegistry meterRegistry;

    public EngineService(QueueAdapter queueAdapter, JobStateStore jobStateStore, JobExecutor jobExecutor, MeterRegistry meterRegistry) {
        this.queueAdapter = queueAdapter;
        this.jobStateStore = jobStateStore;
        this.jobExecutor = jobExecutor;
        this.meterRegistry = meterRegistry;
    }

    public Job submit(Job job) {
        Job saved = jobStateStore.save(job);
        queueAdapter.enqueue(saved);
        meterRegistry.counter("sab.jobs.submitted", "tenant_id", saved.tenantId(), "priority", saved.priority().name()).increment();
        return saved;
    }

    public Optional<Job> claimAndExecute(String tenantId, JobPriority priority, String workerId, Duration leaseTtl) {
        Optional<Job> candidate = queueAdapter.dequeue(tenantId, priority);
        if (candidate.isEmpty()) return Optional.empty();

        Job job = candidate.get();
        Optional<Job> claimed = jobStateStore.claimForExecution(job.id(), tenantId, workerId, leaseTtl, Instant.now());
        if (claimed.isEmpty()) {
            queueAdapter.nack(job.id(), "claim_failed");
            return Optional.empty();
        }

        jobExecutor.execute(claimed.get());
        return claimed;
    }
}
