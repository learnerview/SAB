import { AxiosInstance } from 'axios';
import { Tracer } from '../tracing';
import { JobSubmissionRequest, JobResponse, JobHealth, JobStatus } from '../models';
/**
 * Service for handling job-related operations.
 */
export declare class JobService {
    private readonly httpClient;
    private readonly tracer;
    constructor(httpClient: AxiosInstance, tracer: Tracer);
    /**
     * Submits a new job for execution.
     *
     * @param request the job submission request
     * @returns the submitted job response
     */
    submitJob(request: JobSubmissionRequest): Promise<JobResponse>;
    /**
     * Retrieves a job by its ID.
     *
     * @param jobId the job ID
     * @returns the job response if found, null otherwise
     */
    getJob(jobId: string): Promise<JobResponse | null>;
    /**
     * Lists jobs for the current tenant.
     *
     * @returns list of job responses
     */
    listJobs(): Promise<JobResponse[]>;
    /**
     * Cancels a job.
     *
     * @param jobId the job ID to cancel
     * @returns true if cancellation was successful
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * Gets job health information.
     *
     * @returns job health information
     */
    getJobHealth(): Promise<JobHealth>;
    /**
     * Gets available job types.
     *
     * @returns list of available job types
     */
    getJobTypes(): Promise<string[]>;
    /**
     * Waits for a job to complete (polling).
     *
     * @param jobId the job ID to wait for
     * @param options polling options
     * @returns the completed job response
     */
    waitForJob(jobId: string, options?: {
        timeout?: number;
        pollInterval?: number;
        stopOnStatus?: JobStatus[];
    }): Promise<JobResponse>;
}
//# sourceMappingURL=job-service.d.ts.map