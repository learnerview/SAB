// Core dependencies for HTTP client and retry logic
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

// Internal modules
import { SABConfig } from './config';
import { SABError } from './error';
import { Tracer } from './tracing';
import { JobService } from './services/job-service';
import { ScheduleService } from './services/schedule-service';
import { AdminService } from './services/admin-service';

// Model imports
import {
  JobSubmissionRequest,
  JobResponse,
  ScheduleRequest,
  ScheduleResponse,
  ClusterStats,
  QueueStats,
  DLQItem,
  ApiKeyRequest,
  ApiKeyInfo,
  JobHealth,
} from './models';

/**
 * Main client class for interacting with SAB API.
 * Provides methods for job submission, scheduling, and administration.
 */
export class SabClient {
  private readonly httpClient: AxiosInstance;
  private readonly tracer: Tracer;
  private readonly jobService: JobService;
  private readonly scheduleService: ScheduleService;
  private readonly adminService: AdminService;

  /**
   * Internal constructor - use builder pattern.
   * @param config the client configuration
   */
  constructor(private readonly config: SABConfig) {
    this.httpClient = this.createHttpClient();
    this.tracer = new Tracer(config);
    this.jobService = new JobService(this.httpClient, this.tracer);
    this.scheduleService = new ScheduleService(this.httpClient, this.tracer);
    this.adminService = new AdminService(this.httpClient, this.tracer);
  }

  /**
   * Creates a new builder for SabClient.
   * @returns a new ClientBuilder instance
   */
  public static builder(): ClientBuilder {
    return new ClientBuilder();
  }

  /**
   * Submits a new job for execution.
   */
  public async submitJob(request: JobSubmissionRequest): Promise<JobResponse> {
    return this.jobService.submitJob(request);
  }

  /**
   * Submits a new job for execution (alias for submitJob).
   */
  public async submitJobAsync(request: JobSubmissionRequest): Promise<JobResponse> {
    return this.submitJob(request);
  }

  /**
   * Retrieves a job by its ID.
   */
  public async getJob(jobId: string): Promise<JobResponse | null> {
    return this.jobService.getJob(jobId);
  }

  /**
   * Retrieves a job by its ID (alias for getJob).
   */
  public async getJobAsync(jobId: string): Promise<JobResponse | null> {
    return this.getJob(jobId);
  }

  /**
   * Lists jobs for the current tenant.
   */
  public async listJobs(): Promise<JobResponse[]> {
    return this.jobService.listJobs();
  }

  /**
   * Lists jobs for the current tenant (alias for listJobs).
   */
  public async listJobsAsync(): Promise<JobResponse[]> {
    return this.listJobs();
  }

  /**
   * Cancels a job.
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    return this.jobService.cancelJob(jobId);
  }

  /**
   * Cancels a job (alias for cancelJob).
   */
  public async cancelJobAsync(jobId: string): Promise<boolean> {
    return this.cancelJob(jobId);
  }

  /**
   * Gets job health information.
   */
  public async getJobHealth(): Promise<JobHealth> {
    return this.jobService.getJobHealth();
  }

  /**
   * Gets available job types.
   */
  public async getJobTypes(): Promise<string[]> {
    return this.jobService.getJobTypes();
  }

  /**
   * Creates a new schedule.
   */
  public async createSchedule(request: ScheduleRequest): Promise<ScheduleResponse> {
    return this.scheduleService.createSchedule(request);
  }

  /**
   * Creates a new schedule (alias for createSchedule).
   */
  public async createScheduleAsync(request: ScheduleRequest): Promise<ScheduleResponse> {
    return this.createSchedule(request);
  }

  /**
   * Lists schedules for the current tenant.
   */
  public async listSchedules(): Promise<ScheduleResponse[]> {
    return this.scheduleService.listSchedules();
  }

  /**
   * Lists schedules for the current tenant (alias for listSchedules).
   */
  public async listSchedulesAsync(): Promise<ScheduleResponse[]> {
    return this.listSchedules();
  }

  /**
   * Cancels a schedule.
   */
  public async cancelSchedule(scheduleId: string): Promise<boolean> {
    return this.scheduleService.cancelSchedule(scheduleId);
  }

  /**
   * Cancels a schedule (alias for cancelSchedule).
   */
  public async cancelScheduleAsync(scheduleId: string): Promise<boolean> {
    return this.cancelSchedule(scheduleId);
  }

  /**
   * Gets cluster statistics.
   */
  public async getClusterStats(): Promise<ClusterStats> {
    return this.adminService.getClusterStats();
  }

  /**
   * Gets cluster statistics (alias for getClusterStats).
   */
  public async getClusterStatsAsync(): Promise<ClusterStats> {
    return this.getClusterStats();
  }

  /**
   * Gets queue statistics for the current tenant.
   */
  public async getQueueStats(): Promise<QueueStats> {
    return this.adminService.getQueueStats();
  }

  /**
   * Gets queue statistics for the current tenant (alias for getQueueStats).
   */
  public async getQueueStatsAsync(): Promise<QueueStats> {
    return this.getQueueStats();
  }

  /**
   * Lists dead letter queue items.
   */
  public async listDLQ(): Promise<DLQItem[]> {
    return this.adminService.listDLQ();
  }

  /**
   * Lists dead letter queue items (alias for listDLQ).
   */
  public async listDLQAsync(): Promise<DLQItem[]> {
    return this.listDLQ();
  }

  /**
   * Retries a job from the dead letter queue.
   */
  public async retryDLQJob(jobId: string): Promise<boolean> {
    return this.adminService.retryDLQJob(jobId);
  }

  /**
   * Retries a job from the dead letter queue (alias for retryDLQJob).
   */
  public async retryDLQJobAsync(jobId: string): Promise<boolean> {
    return this.retryDLQJob(jobId);
  }

  /**
   * Creates a new API key.
   */
  public async createApiKey(request: ApiKeyRequest): Promise<ApiKeyInfo> {
    return this.adminService.createApiKey(request);
  }

  /**
   * Creates a new API key (alias for createApiKey).
   */
  public async createApiKeyAsync(request: ApiKeyRequest): Promise<ApiKeyInfo> {
    return this.createApiKey(request);
  }

  /**
   * Lists API keys.
   */
  public async listApiKeys(): Promise<ApiKeyInfo[]> {
    return this.adminService.listApiKeys();
  }

  /**
   * Lists API keys (alias for listApiKeys).
   */
  public async listApiKeysAsync(): Promise<ApiKeyInfo[]> {
    return this.listApiKeys();
  }

  /**
   * Deletes an API key.
   */
  public async deleteApiKey(keyId: string): Promise<boolean> {
    return this.adminService.deleteApiKey(keyId);
  }

  /**
   * Deletes an API key (alias for deleteApiKey).
   */
  public async deleteApiKeyAsync(keyId: string): Promise<boolean> {
    return this.deleteApiKey(keyId);
  }

  /**
   * Clears all queues.
   */
  public async clearQueues(): Promise<boolean> {
    return this.adminService.clearQueues();
  }

  /**
   * Creates and configures HTTP client with retry logic and error handling.
   */
  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-Tenant-ID': this.config.tenantId,
        'Content-Type': 'application/json',
        'User-Agent': 'sab-nodejs-sdk/2.0.0',
      },
    });

    axiosRetry(client, {
      retries: this.config.maxRetries,
      retryDelay: (retryCount) => {
        const delay = this.config.retryBackoff * Math.pow(2, retryCount - 1);
        return Math.min(delay, 30000);
      },
      retryCondition: (error) => {
        if (!error.response) return false;
        const status = error.response.status;
        return status >= 500 || status === 429;
      },
    });

    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          const message = data?.message || `HTTP ${status}`;
          const errorCode = data?.errorCode;
          throw new SABError(message, errorCode, status, error);
        } else if (error.request) {
          throw new SABError('Network error: No response received', 'NETWORK_ERROR', 0, error);
        } else {
          throw new SABError(`Request setup error: ${error.message}`, 'REQUEST_ERROR', 0, error);
        }
      }
    );

    return client;
  }
}

/**
 * Builder class for SabClient with fluent API.
 */
export class ClientBuilder {
  private _config: Partial<SABConfig> = {};

  public baseUrl(url: string): ClientBuilder {
    this._config.baseUrl = url;
    return this;
  }

  public apiKey(key: string): ClientBuilder {
    this._config.apiKey = key;
    return this;
  }

  public tenantId(tenantId: string): ClientBuilder {
    this._config.tenantId = tenantId;
    return this;
  }

  public timeout(timeout: number): ClientBuilder {
    this._config.timeout = timeout;
    return this;
  }

  public retry(maxAttempts: number, backoff: number): ClientBuilder {
    this._config.maxRetries = maxAttempts;
    this._config.retryBackoff = backoff;
    return this;
  }

  public config(config: Partial<SABConfig>): ClientBuilder {
    this._config = { ...this._config, ...config };
    return this;
  }

  public build(): SabClient {
    const finalConfig: SABConfig = {
      baseUrl: this._config.baseUrl || 'http://localhost:8080',
      apiKey: this._config.apiKey || '',
      tenantId: this._config.tenantId || '',
      timeout: this._config.timeout || 30000,
      maxRetries: this._config.maxRetries || 3,
      retryBackoff: this._config.retryBackoff || 1000,
      enableTracing: this._config.enableTracing ?? true,
      serviceName: this._config.serviceName || 'sab-nodejs-sdk',
      serviceVersion: this._config.serviceVersion || '2.0.0',
      otelEndpoint: this._config.otelEndpoint || '',
      enableCircuitBreaker: this._config.enableCircuitBreaker ?? true,
      circuitBreakerFailureRateThreshold: this._config.circuitBreakerFailureRateThreshold ?? 50.0,
      circuitBreakerWaitDuration: this._config.circuitBreakerWaitDuration ?? 30000,
      enableRateLimiter: this._config.enableRateLimiter ?? true,
      rateLimitRps: this._config.rateLimitRps ?? 100,
      enableBulkhead: this._config.enableBulkhead ?? true,
      bulkheadMaxConcurrentCalls: this._config.bulkheadMaxConcurrentCalls ?? 100,
      bulkheadMaxWaitDuration: this._config.bulkheadMaxWaitDuration ?? 10000,
    };

    if (!finalConfig.apiKey) {
      throw new SABError('API key is required', 'MISSING_API_KEY');
    }

    if (!finalConfig.tenantId) {
      throw new SABError('Tenant ID is required', 'MISSING_TENANT_ID');
    }

    return new SabClient(finalConfig);
  }
}
