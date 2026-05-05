"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const error_1 = require("../error");
/**
 * Service for handling job-related operations.
 */
class JobService {
    constructor(httpClient, tracer) {
        this.httpClient = httpClient;
        this.tracer = tracer;
    }
    /**
     * Submits a new job for execution.
     *
     * @param request the job submission request
     * @returns the submitted job response
     */
    async submitJob(request) {
        const span = this.tracer.startSpan('sab.job.submit', {
            'job.type': request.jobType,
            'job.priority': request.priority,
        });
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.post('/api/v1/jobs', request);
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Job submission failed', data.errorCode, response.status);
            }
            span.setAttribute('job.id', data.data.jobId);
            return data.data;
        }
        catch (error) {
            span.recordException(error);
            throw error;
        }
        finally {
            scope.close();
            span.end();
        }
    }
    /**
     * Retrieves a job by its ID.
     *
     * @param jobId the job ID
     * @returns the job response if found, null otherwise
     */
    async getJob(jobId) {
        const span = this.tracer.startSpan('sab.job.get', {
            'job.id': jobId,
        });
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get(`/api/v1/jobs/${jobId}`);
            const data = response.data;
            if (!data.success || !data.data) {
                if (response.status === 404) {
                    return null;
                }
                throw new error_1.SABError(data.message || 'Failed to get job', data.errorCode, response.status);
            }
            return data.data;
        }
        catch (error) {
            if (error instanceof error_1.SABError && error.isNotFound) {
                return null;
            }
            span.recordException(error);
            throw error;
        }
        finally {
            scope.close();
            span.end();
        }
    }
    /**
     * Lists jobs for the current tenant.
     *
     * @returns list of job responses
     */
    async listJobs() {
        const span = this.tracer.startSpan('sab.jobs.list');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get('/api/v1/jobs');
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to list jobs', data.errorCode, response.status);
            }
            span.setAttribute('jobs.count', data.data.length);
            return data.data;
        }
        catch (error) {
            span.recordException(error);
            throw error;
        }
        finally {
            scope.close();
            span.end();
        }
    }
    /**
     * Cancels a job.
     *
     * @param jobId the job ID to cancel
     * @returns true if cancellation was successful
     */
    async cancelJob(jobId) {
        const span = this.tracer.startSpan('sab.job.cancel', {
            'job.id': jobId,
        });
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.delete(`/api/v1/jobs/${jobId}`);
            const data = response.data;
            if (!data.success) {
                throw new error_1.SABError(data.message || 'Failed to cancel job', data.errorCode, response.status);
            }
            span.setAttribute('job.cancelled', true);
            return true;
        }
        catch (error) {
            span.recordException(error);
            throw error;
        }
        finally {
            scope.close();
            span.end();
        }
    }
    /**
     * Gets job health information.
     *
     * @returns job health information
     */
    async getJobHealth() {
        const span = this.tracer.startSpan('sab.jobs.health');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get('/api/v1/jobs/health');
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to get job health', data.errorCode, response.status);
            }
            span.setAttribute('jobs.queued', data.data.queued || 0);
            span.setAttribute('jobs.running', data.data.running || 0);
            return data.data;
        }
        catch (error) {
            span.recordException(error);
            throw error;
        }
        finally {
            scope.close();
            span.end();
        }
    }
    /**
     * Gets available job types.
     *
     * @returns list of available job types
     */
    async getJobTypes() {
        const span = this.tracer.startSpan('sab.jobs.types');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get('/api/v1/jobs/types');
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to get job types', data.errorCode, response.status);
            }
            span.setAttribute('jobs.types.count', data.data.length);
            return data.data;
        }
        catch (error) {
            span.recordException(error);
            throw error;
        }
        finally {
            scope.close();
            span.end();
        }
    }
    /**
     * Waits for a job to complete (polling).
     *
     * @param jobId the job ID to wait for
     * @param options polling options
     * @returns the completed job response
     */
    async waitForJob(jobId, options = {}) {
        const { timeout = 300000, // 5 minutes
        pollInterval = 1000, // 1 second
        stopOnStatus = ['SUCCESS', 'FAILED', 'DLQ', 'CANCELLED'], } = options;
        const span = this.tracer.startSpan('sab.job.wait', {
            'job.id': jobId,
            'job.wait.timeout': timeout,
            'job.wait.pollInterval': pollInterval,
        });
        const scope = span.makeCurrent();
        const startTime = Date.now();
        try {
            while (Date.now() - startTime < timeout) {
                const job = await this.getJob(jobId);
                if (!job) {
                    throw new error_1.SABError(`Job ${jobId} not found`, 'NOT_FOUND', 404);
                }
                if (stopOnStatus.includes(job.status)) {
                    span.setAttribute('job.final.status', job.status);
                    return job;
                }
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            }
            throw new error_1.SABError(`Timeout waiting for job ${jobId} to complete`, 'TIMEOUT_ERROR', 408);
        }
        catch (error) {
            span.recordException(error);
            throw error;
        }
        finally {
            scope.close();
            span.end();
        }
    }
}
exports.JobService = JobService;
//# sourceMappingURL=job-service.js.map