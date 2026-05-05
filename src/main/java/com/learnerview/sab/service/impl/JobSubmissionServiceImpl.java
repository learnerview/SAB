// Job submission service implementation for SAB job scheduling platform
// This service handles job submission, validation, and lifecycle management.
// It provides comprehensive job management with idempotency, rate limiting,
// and multi-tenant isolation.
//
// Key features:
// - Idempotent job submission with duplicate detection
// - Rate limiting for abuse prevention
// - Queue depth management and overflow protection
// - Job cancellation and status management
// - Real-time event broadcasting via SSE
// - Comprehensive job querying and pagination
package com.learnerview.sab.service.impl;

// Configuration imports
import com.learnerview.sab.config.SchedulerProperties;
// DTO imports for request/response objects
import com.learnerview.sab.dto.JobResponse;
import com.learnerview.sab.dto.JobSubmissionRequest;
import com.learnerview.sab.dto.JobSubmissionResponse;
// Entity imports
import com.learnerview.sab.entity.JobEntity;
// Exception imports
import com.learnerview.sab.exception.JobNotFoundException;
import com.learnerview.sab.exception.QueueFullException;
// Utility imports
import com.learnerview.sab.mapper.JobMapper;
import com.learnerview.sab.model.JobPriority;
import com.learnerview.sab.model.JobStatus;
import com.learnerview.sab.repository.JobEntityRepository;
import com.learnerview.sab.repository.QueueRepository;
// Service imports
import com.learnerview.sab.service.JobSubmissionService;
import com.learnerview.sab.service.RateLimiterService;
import com.learnerview.sab.service.SseEmitterService;
// Observability imports
import io.micrometer.observation.annotation.Observed;
// Spring and Lombok imports
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

// Utility imports
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

// Service implementation for job submission and management
// Active in 'api' profile to handle HTTP API requests
@Service
@Profile("api")
@Slf4j
@RequiredArgsConstructor
public class JobSubmissionServiceImpl implements JobSubmissionService {

    // Repository for job persistence and retrieval
    private final JobEntityRepository jobRepo;
    // Repository for queue operations
    private final QueueRepository queueRepo;
    // Service for rate limiting enforcement
    private final RateLimiterService rateLimiter;
    // Configuration properties
    private final SchedulerProperties props;
    // Mapper for entity-DTO conversions
    private final JobMapper jobMapper;
    // Service for real-time event broadcasting
    private final SseEmitterService sseEmitterService;

    // Submit a new job with validation and idempotency checks
    @Override
    @Observed(name = "sab.job.submit", contextualName = "job submit")
    public JobSubmissionResponse submit(String producer, JobSubmissionRequest req) {
        // Enforce rate limits for the producer
        rateLimiter.checkRateLimit(producer);

        // Validate required idempotency key
        if (req.getIdempotencyKey() == null || req.getIdempotencyKey().isBlank()) {
            throw new IllegalArgumentException("idempotencyKey is required");
        }

        // Validate execution type (only HTTP supported)
        if (!"HTTP".equalsIgnoreCase(req.getExecution().getType())) {
            throw new IllegalArgumentException("Unsupported execution.type: " + req.getExecution().getType());
        }

        // Check queue depth to prevent overflow
        long totalDepth = queueRepo.queueSize(producer, JobPriority.HIGH)
            + queueRepo.queueSize(producer, JobPriority.NORMAL)
            + queueRepo.queueSize(producer, JobPriority.LOW);
        if (totalDepth >= props.getQueue().getMaxDepth()) {
            throw new QueueFullException(props.getQueue().getMaxDepth());
        }

        // Check for existing job with same idempotency key
        JobEntity existing = jobRepo.findByProducerAndIdempotencyKey(producer, req.getIdempotencyKey())
            .orElse(null);
        if (existing != null) {
            // Return existing job details for idempotent response
            return JobSubmissionResponse.builder()
                .jobId(existing.getId())
                .status(existing.getStatus().name())
                .jobType(existing.getJobType())
                .priority(existing.getPriority().name())
                .scheduledAt(existing.getNextRunAt())
                .build();
        }

        // Parse and validate job priority
        JobPriority priority = jobMapper.parsePriority(req.getPriority());
        // Determine scheduled execution time
        Instant nextRunAt = req.getNextRunAt() != null ? req.getNextRunAt() : Instant.now();
        // Generate unique job identifier
        String jobId = UUID.randomUUID().toString();

        // Create and configure new job entity
        JobEntity job = JobEntity.builder()
                .id(jobId)
                .jobType(req.getJobType())
            .producer(producer)
            .idempotencyKey(req.getIdempotencyKey())
                .status(JobStatus.QUEUED)
                .priority(priority)
                .payload(jobMapper.serializePayload(req.getPayload()))
            .executionType(req.getExecution().getType())
            .executionEndpoint(req.getExecution().getEndpoint())
            .timeoutSeconds(req.getTimeoutSeconds())
            .callbackUrl(req.getCallbackUrl())
            .nextRunAt(nextRunAt)
            .maxAttempts(req.getMaxAttempts() != null ? req.getMaxAttempts() : props.getRetry().getMaxAttempts())
                .build();

        // Persist job and enqueue for execution
        jobRepo.save(job);
        queueRepo.enqueue(producer, jobId, priority, nextRunAt.toEpochMilli());
        log.info("Job submitted: {} type={} priority={}", jobId, req.getJobType(), priority);

        // Broadcast job creation event
        sseEmitterService.broadcast(producer, "JOB_CREATED", Map.of(
                "id", jobId,
                "jobType", req.getJobType(),
                "status", "QUEUED",
                "priority", priority.name(),
            "producer", producer
        ));

        // Return job submission response
        return JobSubmissionResponse.builder()
                .jobId(jobId)
                .status(JobStatus.QUEUED.name())
                .jobType(req.getJobType())
                .priority(priority.name())
            .scheduledAt(nextRunAt)
                .build();
    }

    // Retrieve job details with tenant isolation
    @Override
    public JobResponse getJob(String producer, String jobId) {
        JobEntity job = jobRepo.findByProducerAndId(producer, jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));
        return jobMapper.toResponse(job);
    }

    // Retrieve job details without tenant check (admin access)
    @Override
    public JobResponse getJob(String jobId) {
        JobEntity job = jobRepo.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));
        return jobMapper.toResponse(job);
    }

    // Cancel a queued job with cleanup and event broadcasting
    @Override
    public void cancelJob(String producer, String jobId) {
        JobEntity job = jobRepo.findByProducerAndId(producer, jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));
        // Only allow cancellation of queued jobs
        if (job.getStatus() == JobStatus.QUEUED) {
            // Remove from queue and update job status
            queueRepo.remove(producer, jobId, job.getPriority());
            job.setStatus(JobStatus.FAILED);
            job.setVisibleAt(null);
            job.setLeaseOwner(null);
            job.setLeaseToken(null);
            job.setResult("Cancelled by user");
            job.setCompletedAt(Instant.now());
            jobRepo.save(job);
            // Broadcast cancellation event
            sseEmitterService.broadcast(producer, "JOB_UPDATE", Map.of(
                    "id", jobId, "status", "FAILED", "result", "Cancelled by user"
            ));
        } else {
            throw new IllegalArgumentException("Can only cancel QUEUED jobs, current: " + job.getStatus());
        }
    }

    // List jobs for a specific producer with pagination
    @Override
    public org.springframework.data.domain.Page<JobResponse> listJobs(String producer, org.springframework.data.domain.Pageable pageable) {
        return jobRepo.findByProducerOrderByCreatedAtDesc(producer, pageable).map(jobMapper::toResponse);
    }

    // List all jobs with pagination (admin access)
    @Override
    public org.springframework.data.domain.Page<JobResponse> listJobs(org.springframework.data.domain.Pageable pageable) {
        return jobRepo.findAllByOrderByCreatedAtDesc(pageable).map(jobMapper::toResponse);
    }
}
