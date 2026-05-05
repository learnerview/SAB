import { AxiosInstance } from 'axios';
import { Tracer } from '../tracing';
import { SABError } from '../error';
import { JobSubmissionRequest, JobResponse, JobHealth, ApiResponse, JobStatus } from '../models';

/**
 * Service for handling job-related operations.
 */
export class JobService {
  constructor(
    private readonly httpClient: AxiosInstance,
    private readonly tracer: Tracer
  ) {}

  /**
   * Submits a new job for execution.
   *
   * @param request the job submission request
   * @returns the submitted job response
   */
  public async submitJob(request: JobSubmissionRequest): Promise<JobResponse> {
    const span = this.tracer.startSpan('sab.job.submit', {
      'job.type': request.jobType,
      'job.priority': request.priority,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.post<ApiResponse<JobResponse>>(
        '/api/v1/jobs',
        request
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Job submission failed',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('job.id', data.data.jobId);
      return data.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
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
  public async getJob(jobId: string): Promise<JobResponse | null> {
    const span = this.tracer.startSpan('sab.job.get', {
      'job.id': jobId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<JobResponse>>(`/api/v1/jobs/${jobId}`);

      const data = response.data;
      if (!data.success || !data.data) {
        if (response.status === 404) {
          return null;
        }
        throw new SABError(data.message || 'Failed to get job', data.errorCode, response.status);
      }

      return data.data;
    } catch (error) {
      if (error instanceof SABError && error.isNotFound) {
        return null;
      }
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Lists jobs for the current tenant.
   *
   * @returns list of job responses
   */
  public async listJobs(): Promise<JobResponse[]> {
    const span = this.tracer.startSpan('sab.jobs.list');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<JobResponse[]>>('/api/v1/jobs');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(data.message || 'Failed to list jobs', data.errorCode, response.status);
      }

      span.setAttribute('jobs.count', data.data.length);
      return data.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
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
  public async cancelJob(jobId: string): Promise<boolean> {
    const span = this.tracer.startSpan('sab.job.cancel', {
      'job.id': jobId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.delete<ApiResponse<void>>(`/api/v1/jobs/${jobId}`);

      const data = response.data;
      if (!data.success) {
        throw new SABError(data.message || 'Failed to cancel job', data.errorCode, response.status);
      }

      span.setAttribute('job.cancelled', true);
      return true;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Gets job health information.
   *
   * @returns job health information
   */
  public async getJobHealth(): Promise<JobHealth> {
    const span = this.tracer.startSpan('sab.jobs.health');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<JobHealth>>('/api/v1/jobs/health');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to get job health',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('jobs.queued', data.data.queued || 0);
      span.setAttribute('jobs.running', data.data.running || 0);
      return data.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Gets available job types.
   *
   * @returns list of available job types
   */
  public async getJobTypes(): Promise<string[]> {
    const span = this.tracer.startSpan('sab.jobs.types');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<string[]>>('/api/v1/jobs/types');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to get job types',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('jobs.types.count', data.data.length);
      return data.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
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
  public async waitForJob(
    jobId: string,
    options: {
      timeout?: number;
      pollInterval?: number;
      stopOnStatus?: JobStatus[];
    } = {}
  ): Promise<JobResponse> {
    const {
      timeout = 300000, // 5 minutes
      pollInterval = 1000, // 1 second
      stopOnStatus = ['SUCCESS', 'FAILED', 'DLQ', 'CANCELLED'],
    } = options;

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
          throw new SABError(`Job ${jobId} not found`, 'NOT_FOUND', 404);
        }

        if (stopOnStatus.includes(job.status)) {
          span.setAttribute('job.final.status', job.status);
          return job;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      throw new SABError(`Timeout waiting for job ${jobId} to complete`, 'TIMEOUT_ERROR', 408);
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }
}
