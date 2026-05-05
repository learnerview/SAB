package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.util.Map;

/**
 * Request object for submitting a job.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobSubmissionRequest {
    /**
     * The type of job to execute.
     */
    @NotBlank(message = "Job type is required")
    private String jobType;

    /**
     * Job priority level.
     */
    @NotNull
    private JobPriority priority;

    /**
     * Payload data for the job.
     */
    private Map<String, Object> payload;

    /**
     * Execution policy for the job.
     */
    private ExecutionPolicy execution;

    /**
     * Maximum number of retry attempts.
     */
    @Builder.Default
    private Integer maxAttempts = 3;

    /**
     * Unique identifier for idempotency.
     */
    private String idempotencyKey;

    /**
     * Delay before executing the job.
     */
    private Duration delay;

    /**
     * Time-to-live for the job.
     */
    private Duration ttl;

    /**
     * Tags for job categorization.
     */
    private Map<String, String> tags;

    /**
     * Callback URL for job completion notifications.
     */
    private String callbackUrl;

    /**
     * Execution policy configuration.
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
        private RetryPolicy retryPolicy;
    }

    /**
     * Retry policy configuration.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RetryPolicy {
        private Integer maxAttempts;
        private Long initialBackoffMs;
        private Long maxBackoffMs;
        private Double multiplier;
        private Boolean useJitter;
    }
}
