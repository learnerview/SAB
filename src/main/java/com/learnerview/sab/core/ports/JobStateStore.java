package com.learnerview.sab.core.ports;

import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobStatus;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface JobStateStore {
    Job save(Job job);

    Optional<Job> findById(String id, String tenantId);

    Optional<Job> findByIdempotencyKey(String tenantId, String idempotencyKey);

    List<Job> findByStatus(JobStatus status, String tenantId);

    void updateStatus(String jobId, JobStatus status, String tenantId);

    Optional<Job> claimForExecution(String jobId,
                                   String tenantId,
                                   String workerId,
                                   Duration leaseTtl,
                                   Instant now);

    List<Job> findDueRetries(Instant now, int limit);

    List<Job> findExpiredLeases(Duration leaseTimeout);
}


