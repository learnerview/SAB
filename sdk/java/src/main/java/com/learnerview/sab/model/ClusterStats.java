package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Cluster-wide statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClusterStats {
    /**
     * Total number of jobs.
     */
    private long totalJobs;

    /**
     * Number of running jobs.
     */
    private long runningJobs;

    /**
     * Number of queued jobs.
     */
    private long queuedJobs;

    /**
     * Number of failed jobs.
     */
    private long failedJobs;

    /**
     * Number of successful jobs.
     */
    private long successfulJobs;

    /**
     * Number of jobs in DLQ.
     */
    private long dlqJobs;

    /**
     * Number of active workers.
     */
    private int activeWorkers;

    /**
     * Throughput (jobs per second).
     */
    private double throughput;

    /**
     * Statistics per job type.
     */
    private Map<String, JobTypeStats> jobTypeStats;

    /**
     * Statistics for a specific job type.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobTypeStats {
        private long total;
        private long running;
        private long queued;
        private long failed;
        private long success;
    }
}
