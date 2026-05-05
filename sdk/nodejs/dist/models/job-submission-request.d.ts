import { ExecutionPolicy, JobPriority, RetryPolicy } from './common';
export interface JobSubmissionRequest {
    jobType: string;
    priority: JobPriority;
    payload?: Record<string, any>;
    execution?: ExecutionPolicy;
    maxAttempts?: number;
    idempotencyKey?: string;
    delay?: number;
    ttl?: number;
    tags?: Record<string, string>;
    callbackUrl?: string;
}
export declare function createJobSubmissionRequest(jobType: string, priority?: JobPriority): JobSubmissionRequest;
export declare function createWebhookJobRequest(endpoint: string, payload?: Record<string, any>, priority?: JobPriority, timeoutSeconds?: number): JobSubmissionRequest;
export declare function createJobWithRetry(jobType: string, priority: JobPriority, maxAttempts: number, retryPolicy: RetryPolicy): JobSubmissionRequest;
//# sourceMappingURL=job-submission-request.d.ts.map