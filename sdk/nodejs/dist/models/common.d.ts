export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'RETRY_SCHEDULED' | 'DLQ' | 'CANCELLED';
export type ExecutionType = 'HTTP' | 'WEBHOOK';
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errorCode?: string;
    timestamp?: number;
}
export interface ListResponse<T = any> extends ApiResponse<T[]> {
}
export interface ExecutionPolicy {
    type: ExecutionType;
    endpoint: string;
    timeoutSeconds?: number;
    callbackUrl?: string;
    headers?: Record<string, string>;
    retryPolicy?: RetryPolicy;
}
export interface RetryPolicy {
    maxAttempts?: number;
    initialBackoffMs?: number;
    maxBackoffMs?: number;
    multiplier?: number;
    useJitter?: boolean;
}
export interface MemoryInfo {
    totalBytes?: number;
    usedBytes?: number;
    freeBytes?: number;
    usagePercentage?: number;
}
export interface CpuInfo {
    usagePercentage?: number;
    availableProcessors?: number;
    systemLoadAverage?: number;
}
export interface LeaseInfo {
    owner?: string;
    token?: string;
    expiresAt?: string;
    visibleAt?: string;
}
//# sourceMappingURL=common.d.ts.map