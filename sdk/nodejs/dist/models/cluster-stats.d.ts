import { MemoryInfo, CpuInfo } from './common';
export interface ClusterStats {
    totalJobs?: number;
    runningJobs?: number;
    queuedJobs?: number;
    successfulJobs?: number;
    failedJobs?: number;
    dlqJobs?: number;
    activeWorkers?: number;
    activeSchedules?: number;
    uptimeMs?: number;
    memory?: MemoryInfo;
    cpu?: CpuInfo;
}
export declare function getJobSuccessRate(stats: ClusterStats): number | null;
export declare function getJobFailureRate(stats: ClusterStats): number | null;
export declare function getSystemHealth(stats: ClusterStats): 'HEALTHY' | 'WARNING' | 'CRITICAL';
export declare function formatUptime(uptimeMs: number): string;
//# sourceMappingURL=cluster-stats.d.ts.map