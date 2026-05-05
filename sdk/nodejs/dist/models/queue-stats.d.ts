export interface QueueStats {
    highPriorityQueued?: number;
    normalPriorityQueued?: number;
    lowPriorityQueued?: number;
    queued?: number;
    running?: number;
    success?: number;
    failed?: number;
    dlq?: number;
    throughput?: number;
    avgExecutionTimeMs?: number;
    avgWaitTimeMs?: number;
    queueAgeMs?: number;
}
export declare function getTotalQueued(stats: QueueStats): number;
export declare function getQueueSuccessRate(stats: QueueStats): number | null;
export declare function getQueueFailureRate(stats: QueueStats): number | null;
export declare function getQueueHealth(stats: QueueStats): 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'IDLE';
export declare function formatQueueAge(queueAgeMs: number): string;
export declare function getPriorityDistribution(stats: QueueStats): {
    high: number;
    normal: number;
    low: number;
    percentages: {
        high: number;
        normal: number;
        low: number;
    };
};
//# sourceMappingURL=queue-stats.d.ts.map