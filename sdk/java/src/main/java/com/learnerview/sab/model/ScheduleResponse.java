package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Response object for schedule information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScheduleResponse {
    /**
     * Unique schedule identifier.
     */
    private String id;

    /**
     * Cron expression.
     */
    private String cron;

    /**
     * Job type.
     */
    private String jobType;

    /**
     * Job priority.
     */
    private JobPriority priority;

    /**
     * Payload data.
     */
    private Map<String, Object> payload;

    /**
     * Whether the schedule is active.
     */
    private boolean active;

    /**
     * Schedule creation timestamp.
     */
    private Instant createdAt;

    /**
     * Timestamp of the next scheduled execution.
     */
    private Instant nextRunAt;

    /**
     * Timestamp of the last execution.
     */
    private Instant lastRunAt;

    /**
     * Tenant ID.
     */
    private String tenantId;
}
