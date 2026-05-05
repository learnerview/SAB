package com.learnerview.sab.engine;

import com.learnerview.sab.config.SchedulerProperties;
import com.learnerview.sab.core.domain.ExecutionPolicy;
import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.JobStatus;
import com.learnerview.sab.core.ports.JobStateStore;
import com.learnerview.sab.core.ports.QueueAdapter;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class LeaseReaperTest {

    @Test
    void requeuesExpiredLeaseWhenAttemptsRemain() {
        JobStateStore jobStateStore = mock(JobStateStore.class);
        QueueAdapter queueAdapter = mock(QueueAdapter.class);
        SchedulerProperties props = new SchedulerProperties();
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        LeaseReaper reaper = new LeaseReaper(jobStateStore, queueAdapter, props, meterRegistry);

        Job job = new Job(
                "job-1",
                "tenant-1",
                "webhook",
                "idemp-1",
                JobStatus.RUNNING,
                JobPriority.NORMAL,
                "{}",
                null,
                new ExecutionPolicy("HTTP", "https://example.com", 5, null),
                Instant.now().minusSeconds(60),
                null,
                "worker-a",
                "lease-token",
                Instant.now().minusSeconds(60),
                null,
                0,
                3,
                Instant.now().minusSeconds(70),
                Instant.now().minusSeconds(10)
        );

        when(jobStateStore.findExpiredLeases(any())).thenReturn(List.of(job));

        reaper.recoverExpiredLeases();

        ArgumentCaptor<Job> captor = ArgumentCaptor.forClass(Job.class);
        verify(jobStateStore).save(captor.capture());
        verify(queueAdapter).enqueue(captor.getValue());
        assertThat(meterRegistry.counter("sab.lease.reaper.recovered", "tenant_id", "tenant-1").count()).isEqualTo(1.0);
        assertThat(captor.getValue().status()).isEqualTo(JobStatus.QUEUED);
        assertThat(captor.getValue().leaseOwner()).isNull();
        assertThat(captor.getValue().leaseToken()).isNull();
    }

    @Test
    void movesExpiredLeaseToDlqWhenAttemptsExhausted() {
        JobStateStore jobStateStore = mock(JobStateStore.class);
        QueueAdapter queueAdapter = mock(QueueAdapter.class);
        SchedulerProperties props = new SchedulerProperties();
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        LeaseReaper reaper = new LeaseReaper(jobStateStore, queueAdapter, props, meterRegistry);

        Job job = new Job(
                "job-2",
                "tenant-1",
                "webhook",
                "idemp-2",
                JobStatus.RUNNING,
                JobPriority.NORMAL,
                "{}",
                null,
                new ExecutionPolicy("HTTP", "https://example.com", 5, null),
                Instant.now().minusSeconds(60),
                null,
                "worker-a",
                "lease-token",
                Instant.now().minusSeconds(60),
                null,
                3,
                3,
                Instant.now().minusSeconds(70),
                Instant.now().minusSeconds(10)
        );

        when(jobStateStore.findExpiredLeases(any())).thenReturn(List.of(job));

        reaper.recoverExpiredLeases();

        verify(jobStateStore).updateStatus("job-2", JobStatus.DLQ, "tenant-1");
        verify(queueAdapter, never()).enqueue(any());
        assertThat(meterRegistry.counter("sab.jobs.dlq", "tenant_id", "tenant-1").count()).isEqualTo(1.0);
    }
}


