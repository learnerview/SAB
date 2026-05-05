package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Health information for the job system.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobHealth {
    /**
     * Number of queued jobs.
     */
    private long queued;

    /**
     * Number of running jobs.
     */
    private long running;

    /**
     * Number of healthy workers.
     */
    private int healthyWorkers;

    /**
     * Number of unhealthy workers.
     */
    private int unhealthyWorkers;

    /**
     * System health status (e.g., HEALTHY, DEGRADED, UNHEALTHY).
     */
    private String status;
}
