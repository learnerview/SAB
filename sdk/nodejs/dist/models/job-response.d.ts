import { ExecutionPolicy, JobPriority, JobStatus, LeaseInfo } from './common';
export interface JobResponse {
    jobId: string;
    jobType: string;
    priority: JobPriority;
    status: JobStatus;
    payload?: Record<string, any>;
    execution?: ExecutionPolicy;
    maxAttempts?: number;
    attemptCount?: number;
    createdAt?: string;
    scheduledAt?: string;
    startedAt?: string;
    completedAt?: string;
    nextRetryAt?: string;
    errorMessage?: string;
    result?: Record<string, any>;
    tags?: Record<string, string>;
    callbackUrl?: string;
    tenantId?: string;
    workerId?: string;
    lease?: LeaseInfo;
}
export declare function isJobRunning(job: JobResponse): boolean;
export declare function isJobSuccessful(job: JobResponse): boolean;
export declare function isJobFailed(job: JobResponse): boolean;
export declare function isJobQueued(job: JobResponse): boolean;
export declare function isJobRetrying(job: JobResponse): boolean;
export declare function getJobDuration(job: JobResponse): number | null;
export declare function getJobWaitTime(job: JobResponse): number | null;
//# sourceMappingURL=job-response.d.ts.map