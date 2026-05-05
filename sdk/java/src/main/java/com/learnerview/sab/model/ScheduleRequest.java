package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request object for creating a schedule.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScheduleRequest {
    /**
     * Cron expression for the schedule.
     */
    private String cron;

    /**
     * Job type to execute.
     */
    private String jobType;

    /**
     * Job priority level.
     */
    private JobPriority priority;

    /**
     * Payload data for the job.
     */
    private Map<String, Object> payload;

    /**
     * Execution policy for the job.
     */
    private JobSubmissionRequest.ExecutionPolicy execution;

    /**
     * Maximum number of retry attempts for scheduled jobs.
     */
    @Builder.Default
    private Integer maxAttempts = 3;

    /**
     * Tags for job categorization.
     */
    private Map<String, String> tags;
}
