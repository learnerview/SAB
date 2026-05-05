package com.learnerview.sab.adapters.state;

import com.learnerview.sab.core.domain.ExecutionPolicy;
import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.JobStatus;
import com.learnerview.sab.entity.JobEntity;

public class JobEntityMapper {

    public Job toDomain(JobEntity entity) {
        if (entity == null) return null;

        ExecutionPolicy execution = new ExecutionPolicy(
                entity.getExecutionType(),
                entity.getExecutionEndpoint(),
                entity.getTimeoutSeconds(),
                entity.getCallbackUrl()
        );

        return new Job(
                entity.getId(),
                entity.getProducer(),
                entity.getJobType(),
                entity.getIdempotencyKey(),
                JobStatus.valueOf(entity.getStatus().name()),
                JobPriority.valueOf(entity.getPriority().name()),
                entity.getPayload(),
                entity.getResult(),
                execution,
                entity.getNextRunAt(),
                entity.getVisibleAt(),
                entity.getLeaseOwner(),
                entity.getLeaseToken(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getAttemptCount(),
                entity.getMaxAttempts(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public JobEntity toEntity(Job job) {
        if (job == null) return null;

        JobEntity entity = new JobEntity();
        entity.setId(job.id());
        entity.setProducer(job.tenantId());
        entity.setJobType(job.jobType());
        entity.setIdempotencyKey(job.idempotencyKey());
        entity.setStatus(com.learnerview.sab.model.JobStatus.valueOf(job.status().name()));
        entity.setPriority(com.learnerview.sab.model.JobPriority.valueOf(job.priority().name()));
        entity.setPayload(job.payload());
        entity.setResult(job.result());
        entity.setNextRunAt(job.nextRunAt());
        entity.setVisibleAt(job.visibleAt());
        entity.setLeaseOwner(job.leaseOwner());
        entity.setLeaseToken(job.leaseToken());
        entity.setStartedAt(job.startedAt());
        entity.setCompletedAt(job.completedAt());
        entity.setAttemptCount(job.attemptCount());
        entity.setMaxAttempts(job.maxAttempts());
        entity.setCreatedAt(job.createdAt());
        entity.setUpdatedAt(job.updatedAt());

        if (job.execution() != null) {
            entity.setExecutionType(job.execution().type());
            entity.setExecutionEndpoint(job.execution().endpoint());
            entity.setTimeoutSeconds(job.execution().timeoutSeconds());
            entity.setCallbackUrl(job.execution().callbackUrl());
        }

        return entity;
    }
}


