import { SABConfig } from './config';
import { JobSubmissionRequest, JobResponse, ScheduleRequest, ScheduleResponse, ClusterStats, QueueStats, DLQItem, ApiKeyRequest, ApiKeyInfo, JobHealth } from './models';
/**
 * Main client class for interacting with SAB API.
 * Provides methods for job submission, scheduling, and administration.
 */
export declare class SabClient {
    private readonly config;
    private readonly httpClient;
    private readonly tracer;
    private readonly jobService;
    private readonly scheduleService;
    private readonly adminService;
    /**
     * Internal constructor - use builder pattern.
     * @param config the client configuration
     */
    constructor(config: SABConfig);
    /**
     * Creates a new builder for SabClient.
     * @returns a new ClientBuilder instance
     */
    static builder(): ClientBuilder;
    /**
     * Submits a new job for execution.
     */
    submitJob(request: JobSubmissionRequest): Promise<JobResponse>;
    /**
     * Submits a new job for execution (alias for submitJob).
     */
    submitJobAsync(request: JobSubmissionRequest): Promise<JobResponse>;
    /**
     * Retrieves a job by its ID.
     */
    getJob(jobId: string): Promise<JobResponse | null>;
    /**
     * Retrieves a job by its ID (alias for getJob).
     */
    getJobAsync(jobId: string): Promise<JobResponse | null>;
    /**
     * Lists jobs for the current tenant.
     */
    listJobs(): Promise<JobResponse[]>;
    /**
     * Lists jobs for the current tenant (alias for listJobs).
     */
    listJobsAsync(): Promise<JobResponse[]>;
    /**
     * Cancels a job.
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * Cancels a job (alias for cancelJob).
     */
    cancelJobAsync(jobId: string): Promise<boolean>;
    /**
     * Gets job health information.
     */
    getJobHealth(): Promise<JobHealth>;
    /**
     * Gets available job types.
     */
    getJobTypes(): Promise<string[]>;
    /**
     * Creates a new schedule.
     */
    createSchedule(request: ScheduleRequest): Promise<ScheduleResponse>;
    /**
     * Creates a new schedule (alias for createSchedule).
     */
    createScheduleAsync(request: ScheduleRequest): Promise<ScheduleResponse>;
    /**
     * Lists schedules for the current tenant.
     */
    listSchedules(): Promise<ScheduleResponse[]>;
    /**
     * Lists schedules for the current tenant (alias for listSchedules).
     */
    listSchedulesAsync(): Promise<ScheduleResponse[]>;
    /**
     * Cancels a schedule.
     */
    cancelSchedule(scheduleId: string): Promise<boolean>;
    /**
     * Cancels a schedule (alias for cancelSchedule).
     */
    cancelScheduleAsync(scheduleId: string): Promise<boolean>;
    /**
     * Gets cluster statistics.
     */
    getClusterStats(): Promise<ClusterStats>;
    /**
     * Gets cluster statistics (alias for getClusterStats).
     */
    getClusterStatsAsync(): Promise<ClusterStats>;
    /**
     * Gets queue statistics for the current tenant.
     */
    getQueueStats(): Promise<QueueStats>;
    /**
     * Gets queue statistics for the current tenant (alias for getQueueStats).
     */
    getQueueStatsAsync(): Promise<QueueStats>;
    /**
     * Lists dead letter queue items.
     */
    listDLQ(): Promise<DLQItem[]>;
    /**
     * Lists dead letter queue items (alias for listDLQ).
     */
    listDLQAsync(): Promise<DLQItem[]>;
    /**
     * Retries a job from the dead letter queue.
     */
    retryDLQJob(jobId: string): Promise<boolean>;
    /**
     * Retries a job from the dead letter queue (alias for retryDLQJob).
     */
    retryDLQJobAsync(jobId: string): Promise<boolean>;
    /**
     * Creates a new API key.
     */
    createApiKey(request: ApiKeyRequest): Promise<ApiKeyInfo>;
    /**
     * Creates a new API key (alias for createApiKey).
     */
    createApiKeyAsync(request: ApiKeyRequest): Promise<ApiKeyInfo>;
    /**
     * Lists API keys.
     */
    listApiKeys(): Promise<ApiKeyInfo[]>;
    /**
     * Lists API keys (alias for listApiKeys).
     */
    listApiKeysAsync(): Promise<ApiKeyInfo[]>;
    /**
     * Deletes an API key.
     */
    deleteApiKey(keyId: string): Promise<boolean>;
    /**
     * Deletes an API key (alias for deleteApiKey).
     */
    deleteApiKeyAsync(keyId: string): Promise<boolean>;
    /**
     * Clears all queues.
     */
    clearQueues(): Promise<boolean>;
    /**
     * Creates and configures HTTP client with retry logic and error handling.
     */
    private createHttpClient;
}
/**
 * Builder class for SabClient with fluent API.
 */
export declare class ClientBuilder {
    private _config;
    baseUrl(url: string): ClientBuilder;
    apiKey(key: string): ClientBuilder;
    tenantId(tenantId: string): ClientBuilder;
    timeout(timeout: number): ClientBuilder;
    retry(maxAttempts: number, backoff: number): ClientBuilder;
    config(config: Partial<SABConfig>): ClientBuilder;
    build(): SabClient;
}
//# sourceMappingURL=client.d.ts.map