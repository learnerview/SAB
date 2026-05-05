// Queue repository interface for SAB job scheduling platform
// This repository defines the contract for queue operations in the SAB system.
// It provides methods for managing job queues with priority-based scheduling and
// multi-tenant isolation.
//
// Key features:
// - Priority-based queue management
// - Multi-tenant queue isolation
// - Job claiming and leasing mechanisms
// - Queue size monitoring and statistics
// - Bulk operations for queue maintenance
package com.learnerview.sab.repository;

// Model imports
import com.learnerview.sab.model.JobPriority;

// Utility imports
import java.util.Optional;

// Queue repository interface defining the contract for queue operations
// This interface provides the standard operations that any queue implementation
// must support, including enqueueing jobs, claiming jobs for execution,
// and managing queue state across different priorities and tenants.
public interface QueueRepository {

    // Enqueue a job into the priority queue for a specific tenant
    // @param tenantId the tenant identifier for queue isolation
    // @param jobId the unique job identifier
    // @param priority the job priority for scheduling
    // @param scheduledAtEpochMs the scheduled execution time in epoch milliseconds
    void enqueue(String tenantId, String jobId, JobPriority priority, long scheduledAtEpochMs);

    // Claim the next ready job for execution
    // This method atomically claims and removes the next available job
    // from the queue, ensuring no duplicate processing.
    // @param tenantId the tenant identifier
    // @param priority the job priority level
    // @return optional job ID if available, empty otherwise
    Optional<String> claimNextReady(String tenantId, JobPriority priority);

    // Remove a specific job from the queue
    // @param tenantId the tenant identifier
    // @param jobId the job identifier to remove
    // @param priority the job priority level
    void remove(String tenantId, String jobId, JobPriority priority);

    // Get the current size of a specific queue
    // @param tenantId the tenant identifier
    // @param priority the job priority level
    // @return number of jobs currently in the queue
    long queueSize(String tenantId, JobPriority priority);

    // Get the total size across all tenants for a specific priority
    // @param priority the job priority level
    // @return total number of jobs across all tenant queues
    long queueSizeAll(JobPriority priority);

    // Clear all jobs from a specific queue
    // @param tenantId the tenant identifier
    // @param priority the job priority level
    void clearQueue(String tenantId, JobPriority priority);

    // List all tenant IDs that currently have jobs in queues
    // @return list of tenant identifiers with active jobs
    java.util.List<String> listTenantIdsWithJobs();

    // Clear all queues across all tenants and priorities
    // This is typically used for maintenance or testing purposes
    void clearAll();
}


