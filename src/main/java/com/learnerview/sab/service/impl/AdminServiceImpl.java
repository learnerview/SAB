package com.learnerview.sab.service.impl;

import com.learnerview.sab.dto.ApiKeyRequest;
import com.learnerview.sab.dto.ApiKeyResponse;
import com.learnerview.sab.dto.JobResponse;
import com.learnerview.sab.dto.QueueStatsResponse;
import com.learnerview.sab.entity.ApiKeyEntity;
import com.learnerview.sab.entity.JobEntity;
import com.learnerview.sab.exception.JobNotFoundException;
import com.learnerview.sab.mapper.JobMapper;
import com.learnerview.sab.model.JobPriority;
import com.learnerview.sab.model.JobStatus;
import com.learnerview.sab.repository.ApiKeyRepository;
import com.learnerview.sab.repository.JobEntityRepository;
import com.learnerview.sab.repository.QueueRepository;
import com.learnerview.sab.repository.projection.JobCompletionTimingProjection;
import com.learnerview.sab.repository.projection.JobStatusCountProjection;
import com.learnerview.sab.service.AdminService;
import com.learnerview.sab.service.SseEmitterService;
import com.learnerview.sab.security.ApiKeyHasher;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Profile("api")
@RequiredArgsConstructor
@Transactional
public class AdminServiceImpl implements AdminService {

    private final JobEntityRepository jobRepo;
    private final QueueRepository queueRepo;
    private final JobMapper jobMapper;
    private final SseEmitterService sseEmitterService;
    private final ApiKeyRepository apiKeyRepo;
    private final MeterRegistry meterRegistry;

    // Stats

    @Override
    @Transactional(readOnly = true)
    public QueueStatsResponse getStats() {
        Map<JobStatus, Long> statusCounts = countStatusTotals(jobRepo.countByStatusGrouped());
        long queued = statusCounts.getOrDefault(JobStatus.QUEUED, 0L);
        long running = statusCounts.getOrDefault(JobStatus.RUNNING, 0L);
        long success = statusCounts.getOrDefault(JobStatus.SUCCESS, 0L);
        long failed = statusCounts.getOrDefault(JobStatus.FAILED, 0L);
        long dlq = statusCounts.getOrDefault(JobStatus.DLQ, 0L);
        long processed = success + failed + dlq;

        double successRate = processed > 0 ? (success * 100.0 / processed) : 0.0;
        long retried = jobRepo.countByAttemptCountGreaterThanAndStatusIn(
                0, List.of(JobStatus.SUCCESS, JobStatus.FAILED, JobStatus.DLQ));
        double retryRate = processed > 0 ? (retried * 100.0 / processed) : 0.0;

        Instant oneMinAgo = Instant.now().minusSeconds(60);
        double throughput = jobRepo.countByStatusAndCompletedAtAfter(JobStatus.SUCCESS, oneMinAgo);

        List<JobCompletionTimingProjection> recent = jobRepo.findCompletedWithTimingsSince(
                JobStatus.SUCCESS, Instant.now().minusSeconds(300));
        double avgLatency = recent.stream()
                .filter(j -> j.getStartedAt() != null && j.getCompletedAt() != null)
                .mapToLong(j -> j.getCompletedAt().toEpochMilli() - j.getStartedAt().toEpochMilli())
                .average().orElse(0.0);

        return QueueStatsResponse.builder()
            .highQueueSize(queueRepo.queueSizeAll(JobPriority.HIGH))
            .normalQueueSize(queueRepo.queueSizeAll(JobPriority.NORMAL))
            .lowQueueSize(queueRepo.queueSizeAll(JobPriority.LOW))
                .totalQueued(queued)
                .totalRunning(running)
                .totalSuccess(success)
                .totalFailed(failed)
                .totalDlq(dlq)
                .totalProcessed(processed)
                .successRate(Math.round(successRate * 10.0) / 10.0)
                .retryRate(Math.round(retryRate * 10.0) / 10.0)
                .throughputPerMinute(throughput)
                .avgLatencyMs(Math.round(avgLatency * 10.0) / 10.0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public QueueStatsResponse getStats(String producer) {
        Map<JobStatus, Long> statusCounts = countStatusTotals(jobRepo.countByProducerAndStatusGrouped(producer));
        return QueueStatsResponse.builder()
            .totalQueued(statusCounts.getOrDefault(JobStatus.QUEUED, 0L))
            .totalRunning(statusCounts.getOrDefault(JobStatus.RUNNING, 0L))
            .totalSuccess(statusCounts.getOrDefault(JobStatus.SUCCESS, 0L))
            .totalFailed(statusCounts.getOrDefault(JobStatus.FAILED, 0L))
            .totalDlq(statusCounts.getOrDefault(JobStatus.DLQ, 0L))
                .build();
    }

    // Jobs

    @Override
    @Transactional(readOnly = true)
    public Page<JobResponse> listJobs(Pageable pageable) {
        return jobRepo.findAllByOrderByCreatedAtDesc(pageable).map(jobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobResponse> listJobsByStatus(JobStatus status, Pageable pageable) {
        return jobRepo.findByStatusOrderByCreatedAtDesc(status, pageable).map(jobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getRecentJobs() {
        return jobRepo.findTop20ByOrderByCreatedAtDesc().stream()
                .map(jobMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getDlqJobs() {
        return jobRepo.findByStatus(JobStatus.DLQ).stream()
                .map(jobMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void retryDlqJob(String jobId) {
        JobEntity job = jobRepo.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));
        if (job.getStatus() != JobStatus.DLQ) {
            throw new IllegalArgumentException("Job is not in DLQ: " + job.getStatus());
        }
        job.setStatus(JobStatus.QUEUED);
        job.setAttemptCount(0);
        job.setNextRunAt(Instant.now());
        job.setCompletedAt(null);
        job.setResult(null);
        jobRepo.save(job);
        queueRepo.enqueue(job.getProducer(), jobId, job.getPriority(), Instant.now().toEpochMilli());
        sseEmitterService.broadcast(job.getProducer(), "JOB_UPDATE",
                Map.of("id", jobId, "status", "QUEUED", "result", "Retried from DLQ"));
    }

    @Override
    public void clearQueues() {
        queueRepo.clearAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Number> getMetrics() {
        return Map.of(
                "sab.jobs.submitted", sumCounter("sab.jobs.submitted"),
                "sab.jobs.completed", sumCounter("sab.jobs.completed"),
                "sab.jobs.failed", sumCounter("sab.jobs.failed"),
                "sab.jobs.dlq", sumCounter("sab.jobs.dlq"),
                "sab.jobs.retried", sumCounter("sab.jobs.retried"),
                "sab.lease.reaper.recovered", sumCounter("sab.lease.reaper.recovered")
        );
    }

    // API key management; multiple keys per producer are allowed

    @Override
    @Transactional(readOnly = true)
    public List<ApiKeyResponse> listKeys() {
        return apiKeyRepo.findAll().stream()
                .map(this::toMaskedResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(cacheNames = "activeApiKeys", allEntries = true)
    public ApiKeyResponse createKey(ApiKeyRequest request) {
        String secret = "sd_sk_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        ApiKeyEntity entity = ApiKeyEntity.builder()
                .id(UUID.randomUUID().toString())
                .apiKey(ApiKeyHasher.sha256(secret))
                .producer(request.getProducer())
                .label(request.getLabel())
                .admin(request.isAdmin())
                .active(true)
                .createdAt(Instant.now())
                .build();
        ApiKeyResponse response = toResponse(apiKeyRepo.save(entity));
        response.setApiKey(secret);
        return response;
    }

    @Override
    @CacheEvict(cacheNames = "activeApiKeys", allEntries = true)
    public void revokeKey(String keyId) {
        apiKeyRepo.findById(keyId).ifPresent(key -> {
            key.setActive(false);
            apiKeyRepo.save(key);
        });
    }

    private ApiKeyResponse toResponse(ApiKeyEntity e) {
        return ApiKeyResponse.builder()
                .id(e.getId())
                .apiKey(e.getApiKey())
                .producer(e.getProducer())
                .label(e.getLabel())
                .active(e.isActive())
                .admin(e.isAdmin())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private ApiKeyResponse toMaskedResponse(ApiKeyEntity e) {
        ApiKeyResponse response = toResponse(e);
        response.setApiKey(maskKey(e.getApiKey()));
        return response;
    }

    private String maskKey(String keyHash) {
        if (keyHash == null || keyHash.length() < 8) return "******";
        return keyHash.substring(0, 6) + "..." + keyHash.substring(keyHash.length() - 2);
    }

    private double sumCounter(String name) {
        return meterRegistry.find(name).counters().stream().mapToDouble(counter -> counter.count()).sum();
    }

    private Map<JobStatus, Long> countStatusTotals(List<JobStatusCountProjection> counts) {
        Map<JobStatus, Long> totals = new EnumMap<>(JobStatus.class);
        for (JobStatusCountProjection count : counts) {
            if (count.getStatus() != null && count.getCount() != null) {
                totals.put(count.getStatus(), count.getCount());
            }
        }
        return totals;
    }
}
