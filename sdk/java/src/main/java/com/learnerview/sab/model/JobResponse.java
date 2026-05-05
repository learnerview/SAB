package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Response object for job information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobResponse {
    /**
     * Unique job identifier.
     */
    private String jobId;

    /**
     * Job type.
     */
    private String jobType;

    /**
     * Job priority.
     */
    private JobPriority priority;

    /**
     * Current job status.
     */
    private JobStatus status;

    /**
     * Job payload data.
     */
    private Map<String, Object> payload;

    /**
     * Execution policy.
     */
    private ExecutionPolicy execution;

    /**
     * Maximum retry attempts.
     */
    private Integer maxAttempts;

    /**
     * Current attempt number.
     */
    private Integer attemptCount;

    /**
     * Job creation timestamp.
     */
    private Instant createdAt;

    /**
     * Scheduled execution timestamp.
     */
    private Instant scheduledAt;

    /**
     * Job start timestamp.
     */
    private Instant startedAt;

    /**
     * Job completion timestamp.
     */
    private Instant completedAt;

    /**
     * Next retry timestamp (if applicable).
     */
    private Instant nextRetryAt;

    /**
     * Error message (if failed).
     */
    private String errorMessage;

    /**
     * Job result data.
     */
    private Map<String, Object> result;

    /**
     * Job tags.
     */
    private Map<String, String> tags;

    /**
     * Callback URL.
     */
    private String callbackUrl;

    /**
     * Tenant ID.
     */
    private String tenantId;

    /**
     * Worker ID that processed the job.
     */
    private String workerId;

    /**
     * Lease information.
     */
    private LeaseInfo lease;

    /**
     * Execution policy information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ExecutionPolicy {
        private String type;
        private String endpoint;
        private Integer timeoutSeconds;
        private String callbackUrl;
        private Map<String, String> headers;
    }

    /**
     * Lease information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LeaseInfo {
        private String owner;
        private String token;
        private String expiresAt;
        private String visibleAt;
    }
}
