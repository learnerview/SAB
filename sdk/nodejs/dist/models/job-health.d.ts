export interface JobHealth {
    queued?: number;
    running?: number;
    success?: number;
    failed?: number;
    dlq?: number;
    successRate?: number;
    avgExecutionTimeMs?: number;
    avgWaitTimeMs?: number;
    throughput?: number;
}
export declare function getTotalProcessed(health: JobHealth): number;
export declare function calculateSuccessRate(health: JobHealth): number | null;
export declare function calculateFailureRate(health: JobHealth): number | null;
export declare function getHealthStatus(health: JobHealth): 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'IDLE';
export declare function getHealthSummary(health: JobHealth): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'IDLE';
    totalProcessed: number;
    successRate: number | null;
    failureRate: number | null;
    formattedExecutionTime: string;
    formattedWaitTime: string;
    formattedThroughput: string;
};
//# sourceMappingURL=job-health.d.ts.map