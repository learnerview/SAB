// Schedule entity for SAB job scheduling platform
// This JPA entity represents recurring job schedules in the SAB system.
// It supports cron-based scheduling with comprehensive job configuration and
// multi-tenant isolation through producer association.
//
// Key features:
// - Cron expression support for flexible scheduling
// - Multi-tenant isolation through producer field
// - Active/inactive status for schedule lifecycle management
// - Comprehensive job configuration (payload, execution, timeout)
// - Optimistic locking through version field
// - Audit trail through creation and update timestamps
// - Database indexing for efficient schedule queries
package com.learnerview.sab.entity;

// Model imports
import com.learnerview.sab.model.JobPriority;
// JPA annotations for entity mapping
import jakarta.persistence.*;
// Lombok annotations for boilerplate code generation
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Time handling
import java.time.Instant;

// JPA entity representing recurring job schedules
// Maps to the 'job_schedules' table with optimized indexing
// for efficient schedule lookup and processing
@Entity
@Table(name = "job_schedules", indexes = {
        @Index(name = "idx_job_schedules_producer", columnList = "producer"),
        @Index(name = "idx_job_schedules_next_run", columnList = "active, nextRunAt")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleEntity {

    // Primary key identifier for the schedule
    @Id
    @Column(length = 36)
    private String id;

    // Producer/tenant identifier for multi-tenant isolation
    // Associates the schedule with a specific tenant or client
    @Column(nullable = false, length = 120)
    private String producer;

    // Cron expression defining the schedule recurrence pattern
    // Supports standard cron syntax for flexible scheduling
    @Column(name = "cron_expression", nullable = false, length = 120)
    private String cron;

    // Type of job to be created when schedule fires
    // Determines the job processing logic and requirements
    @Column(nullable = false, length = 100)
    private String jobType;

    // Priority level for jobs created by this schedule
    // Affects job execution order and resource allocation
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private JobPriority priority;

    // JSON payload data for jobs created by this schedule
    // Contains job-specific configuration and parameters
    @Column(columnDefinition = "TEXT")
    private String payload;

    // Execution type for jobs (e.g., HTTP, webhook, etc.)
    // Determines how the job will be executed
    @Column(length = 20)
    private String executionType;

    // Endpoint URL for HTTP-based job execution
    // Target destination for webhook or HTTP jobs
    @Column(length = 1000)
    private String executionEndpoint;

    // Timeout duration in seconds for job execution
    // Prevents jobs from running indefinitely
    private Integer timeoutSeconds;

    // Callback URL for job completion notifications
    // Optional endpoint for receiving job status updates
    @Column(length = 2000)
    private String callbackUrl;

    // Maximum number of retry attempts for failed jobs
    // Configures retry behavior for schedule-created jobs
    @Column(nullable = false)
    private Integer maxAttempts;

    // Next scheduled execution time
    // Calculated based on cron expression and last execution
    @Column(nullable = false)
    private Instant nextRunAt;

    // Active status flag for schedule lifecycle management
    // Only active schedules will create new jobs
    @Column(nullable = false)
    private boolean active = true;

    // Optimistic locking version for concurrent updates
    // Prevents lost updates during concurrent modifications
    @Version
    private Long version;

    // Creation timestamp for audit trail
    // Set at creation time and never updated
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    // Last update timestamp for audit trail
    // Automatically updated on any entity modification
    @Column(nullable = false)
    private Instant updatedAt;

    // JPA lifecycle callback for entity creation
    // Sets creation and update timestamps before persisting
    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    // JPA lifecycle callback for entity updates
    // Updates the timestamp before any entity modification
    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}


