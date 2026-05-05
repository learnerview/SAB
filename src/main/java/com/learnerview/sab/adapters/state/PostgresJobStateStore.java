// PostgreSQL job state store adapter for SAB job scheduling platform
// This adapter implements the JobStateStore interface using PostgreSQL as the
// persistence layer. It provides durable job storage with multi-tenant isolation,
// lease management, and comprehensive job lifecycle operations.
//
// Key features:
// - Durable job persistence in PostgreSQL
// - Multi-tenant isolation through producer separation
// - Atomic job claiming with lease management
// - Efficient job queries with database indexing
// - Support for job retries and lease expiration
// - Entity-to-domain mapping with type conversion
package com.learnerview.sab.adapters.state;

// Domain imports
import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobStatus;
// Port interface for dependency inversion
import com.learnerview.sab.core.ports.JobStateStore;
// Entity and repository imports
import com.learnerview.sab.entity.JobEntity;
import com.learnerview.sab.repository.JobEntityRepository;
// Spring annotation
import org.springframework.stereotype.Repository;

// Time and utility imports
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// Repository implementation for PostgreSQL job state management
// Provides durable storage and retrieval of job entities with
// multi-tenant isolation and efficient query operations
@Repository
public class PostgresJobStateStore implements JobStateStore {

    // Repository for database operations
    private final JobEntityRepository jobRepository;
    // Mapper for entity-domain conversions
    private final JobEntityMapper mapper = new JobEntityMapper();

    // Constructor with dependency injection
    public PostgresJobStateStore(JobEntityRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    // Save a job to the database with entity mapping
    @Override
    public Job save(Job job) {
        JobEntity saved = jobRepository.save(mapper.toEntity(job));
        return mapper.toDomain(saved);
    }

    // Find a job by ID with tenant isolation
    @Override
    public Optional<Job> findById(String id, String tenantId) {
        return jobRepository.findByProducerAndId(tenantId, id).map(mapper::toDomain);
    }

    // Find a job by idempotency key for duplicate detection
    @Override
    public Optional<Job> findByIdempotencyKey(String tenantId, String idempotencyKey) {
        return jobRepository.findByProducerAndIdempotencyKey(tenantId, idempotencyKey).map(mapper::toDomain);
    }

    // Find jobs by status for a specific tenant with limit
    @Override
    public List<Job> findByStatus(JobStatus status, String tenantId) {
        return jobRepository.findTop100ByProducerAndStatusOrderByCreatedAtDesc(
                tenantId,
                com.learnerview.sab.model.JobStatus.valueOf(status.name()))
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }

    // Update job status with tenant validation
    @Override
    public void updateStatus(String jobId, JobStatus status, String tenantId) {
        jobRepository.findByProducerAndId(tenantId, jobId).ifPresent(job -> {
            job.setStatus(com.learnerview.sab.model.JobStatus.valueOf(status.name()));
            jobRepository.save(job);
        });
    }

    // Atomically claim a job for execution with lease management
    @Override
    public Optional<Job> claimForExecution(String jobId,
                                           String tenantId,
                                           String workerId,
                                           Duration leaseTtl,
                                           Instant now) {
        // Calculate lease expiration time
        Instant visibleUntil = now.plus(leaseTtl);
        // Attempt atomic claim with optimistic locking
        int updated = jobRepository.claimForExecution(
                jobId,
            tenantId,
                java.util.UUID.randomUUID().toString(),
                workerId,
                visibleUntil,
                now,
                com.learnerview.sab.model.JobStatus.QUEUED,
                com.learnerview.sab.model.JobStatus.RUNNING
        );
        // Return job if claim was successful
        if (updated != 1) return Optional.empty();
        return jobRepository.findByProducerAndId(tenantId, jobId).map(mapper::toDomain);
    }

    // Find jobs with expired leases for lease reaper processing
    @Override
    public List<Job> findExpiredLeases(Duration leaseTimeout) {
        Instant cutoff = Instant.now().minus(leaseTimeout);
        return jobRepository
                .findTop100ByStatusAndVisibleAtBeforeOrderByVisibleAtAsc(
                        com.learnerview.sab.model.JobStatus.RUNNING, cutoff)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    // Find jobs that are due for retry processing
    @Override
    public List<Job> findDueRetries(Instant now, int limit) {
        return jobRepository
            .findTop100ByStatusAndNextRunAtLessThanEqualOrderByNextRunAtAsc(
                com.learnerview.sab.model.JobStatus.RETRY_SCHEDULED, now)
            .stream()
            .limit(limit)
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
}


