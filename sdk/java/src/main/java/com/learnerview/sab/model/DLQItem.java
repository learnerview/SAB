package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Item in the dead letter queue.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DLQItem {
    /**
     * Unique job identifier.
     */
    private String jobId;

    /**
     * Job type.
     */
    private String jobType;

    /**
     * Last error message.
     */
    private String lastError;

    /**
     * Number of failed attempts.
     */
    private int attempts;

    /**
     * Timestamp when it was moved to DLQ.
     */
    private Instant failedAt;

    /**
     * Original job payload.
     */
    private Map<String, Object> payload;

    /**
     * Original job execution policy.
     */
    private JobResponse.ExecutionPolicy execution;

    /**
     * Job tags.
     */
    private Map<String, String> tags;
}
