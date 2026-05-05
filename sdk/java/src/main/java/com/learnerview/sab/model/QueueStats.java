package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Queue statistics for a tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QueueStats {
    /**
     * Number of queued jobs.
     */
    private long queued;

    /**
     * Number of running jobs.
     */
    private long running;

    /**
     * Number of jobs in DLQ.
     */
    private long dlq;

    /**
     * Total number of jobs.
     */
    private long total;

    /**
     * Statistics per queue.
     */
    private Map<String, Long> queueDepths;
}
