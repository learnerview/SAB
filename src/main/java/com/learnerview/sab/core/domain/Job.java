package com.learnerview.sab.core.domain;

import java.time.Instant;

public record Job(
        String id,
        String tenantId,
        String jobType,
        String idempotencyKey,
        JobStatus status,
        JobPriority priority,
        String payload,
        String result,
        ExecutionPolicy execution,
        Instant nextRunAt,
        Instant visibleAt,
        String leaseOwner,
        String leaseToken,
        Instant startedAt,
        Instant completedAt,
        int attemptCount,
        int maxAttempts,
        Instant createdAt,
        Instant updatedAt
) {
}
