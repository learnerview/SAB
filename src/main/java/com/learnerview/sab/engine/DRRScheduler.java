package com.learnerview.sab.engine;

import com.learnerview.sab.config.SchedulerProperties;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.QueueStats;
import com.learnerview.sab.core.ports.QueueAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Profile("worker")
@Slf4j
public class DRRScheduler {

    private final QueueAdapter queueAdapter;
    private final WorkerPool workerPool;
    private final JobPriority[] priorities = JobPriority.values();
    private final int[] weights;
    private final int totalWeight;
    private final int leaseTimeoutSeconds;
    private final Map<String, int[]> deficitsByTenant = new ConcurrentHashMap<>();

    public DRRScheduler(QueueAdapter queueAdapter, SchedulerProperties props, WorkerPool workerPool) {
        this.queueAdapter = queueAdapter;
        this.workerPool = workerPool;
        this.weights = new int[]{
                props.getScheduler().getWeights().getHigh(),
                props.getScheduler().getWeights().getNormal(),
                props.getScheduler().getWeights().getLow()
        };
        this.totalWeight = weights[0] + weights[1] + weights[2];
        this.leaseTimeoutSeconds = props.getWorker().getLeaseTimeoutSeconds();
    }

    @Scheduled(fixedDelayString = "${sab.scheduler.polling-interval-ms:1000}")
    public void poll() {
        for (String tenantId : queueAdapter.listTenantIdsWithJobs()) {
            int[] deficit = deficitsByTenant.computeIfAbsent(tenantId, k -> new int[priorities.length]);

            for (int i = 0; i < priorities.length; i++) {
                deficit[i] += weights[i];
            }

            int bestIdx = -1;
            int bestDeficit = Integer.MIN_VALUE;
            QueueStats stats = queueAdapter.stats(tenantId);

            for (int i = 0; i < priorities.length; i++) {
                long size = switch (priorities[i]) {
                    case HIGH -> stats.highQueueSize();
                    case NORMAL -> stats.normalQueueSize();
                    case LOW -> stats.lowQueueSize();
                };
                if (deficit[i] > bestDeficit && size > 0) {
                    bestDeficit = deficit[i];
                    bestIdx = i;
                }
            }

            if (bestIdx == -1) continue;
            deficit[bestIdx] -= totalWeight;
// submit claim to worker pool for concurrent execution
            workerPool.submitClaim(tenantId, priorities[bestIdx], Duration.ofSeconds(leaseTimeoutSeconds));
            return; // one job per poll
        }
    }
}


