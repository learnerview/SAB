"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientBuilder = exports.SabClient = void 0;
// Core dependencies for HTTP client and retry logic
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const error_1 = require("./error");
const tracing_1 = require("./tracing");
const job_service_1 = require("./services/job-service");
const schedule_service_1 = require("./services/schedule-service");
const admin_service_1 = require("./services/admin-service");
/**
 * Main client class for interacting with SAB API.
 * Provides methods for job submission, scheduling, and administration.
 */
class SabClient {
    /**
     * Internal constructor - use builder pattern.
     * @param config the client configuration
     */
    constructor(config) {
        this.config = config;
        this.httpClient = this.createHttpClient();
        this.tracer = new tracing_1.Tracer(config);
        this.jobService = new job_service_1.JobService(this.httpClient, this.tracer);
        this.scheduleService = new schedule_service_1.ScheduleService(this.httpClient, this.tracer);
        this.adminService = new admin_service_1.AdminService(this.httpClient, this.tracer);
    }
    /**
     * Creates a new builder for SabClient.
     * @returns a new ClientBuilder instance
     */
    static builder() {
        return new ClientBuilder();
    }
    /**
     * Submits a new job for execution.
     */
    async submitJob(request) {
        return this.jobService.submitJob(request);
    }
    /**
     * Submits a new job for execution (alias for submitJob).
     */
    async submitJobAsync(request) {
        return this.submitJob(request);
    }
    /**
     * Retrieves a job by its ID.
     */
    async getJob(jobId) {
        return this.jobService.getJob(jobId);
    }
    /**
     * Retrieves a job by its ID (alias for getJob).
     */
    async getJobAsync(jobId) {
        return this.getJob(jobId);
    }
    /**
     * Lists jobs for the current tenant.
     */
    async listJobs() {
        return this.jobService.listJobs();
    }
    /**
     * Lists jobs for the current tenant (alias for listJobs).
     */
    async listJobsAsync() {
        return this.listJobs();
    }
    /**
     * Cancels a job.
     */
    async cancelJob(jobId) {
        return this.jobService.cancelJob(jobId);
    }
    /**
     * Cancels a job (alias for cancelJob).
     */
    async cancelJobAsync(jobId) {
        return this.cancelJob(jobId);
    }
    /**
     * Gets job health information.
     */
    async getJobHealth() {
        return this.jobService.getJobHealth();
    }
    /**
     * Gets available job types.
     */
    async getJobTypes() {
        return this.jobService.getJobTypes();
    }
    /**
     * Creates a new schedule.
     */
    async createSchedule(request) {
        return this.scheduleService.createSchedule(request);
    }
    /**
     * Creates a new schedule (alias for createSchedule).
     */
    async createScheduleAsync(request) {
        return this.createSchedule(request);
    }
    /**
     * Lists schedules for the current tenant.
     */
    async listSchedules() {
        return this.scheduleService.listSchedules();
    }
    /**
     * Lists schedules for the current tenant (alias for listSchedules).
     */
    async listSchedulesAsync() {
        return this.listSchedules();
    }
    /**
     * Cancels a schedule.
     */
    async cancelSchedule(scheduleId) {
        return this.scheduleService.cancelSchedule(scheduleId);
    }
    /**
     * Cancels a schedule (alias for cancelSchedule).
     */
    async cancelScheduleAsync(scheduleId) {
        return this.cancelSchedule(scheduleId);
    }
    /**
     * Gets cluster statistics.
     */
    async getClusterStats() {
        return this.adminService.getClusterStats();
    }
    /**
     * Gets cluster statistics (alias for getClusterStats).
     */
    async getClusterStatsAsync() {
        return this.getClusterStats();
    }
    /**
     * Gets queue statistics for the current tenant.
     */
    async getQueueStats() {
        return this.adminService.getQueueStats();
    }
    /**
     * Gets queue statistics for the current tenant (alias for getQueueStats).
     */
    async getQueueStatsAsync() {
        return this.getQueueStats();
    }
    /**
     * Lists dead letter queue items.
     */
    async listDLQ() {
        return this.adminService.listDLQ();
    }
    /**
     * Lists dead letter queue items (alias for listDLQ).
     */
    async listDLQAsync() {
        return this.listDLQ();
    }
    /**
     * Retries a job from the dead letter queue.
     */
    async retryDLQJob(jobId) {
        return this.adminService.retryDLQJob(jobId);
    }
    /**
     * Retries a job from the dead letter queue (alias for retryDLQJob).
     */
    async retryDLQJobAsync(jobId) {
        return this.retryDLQJob(jobId);
    }
    /**
     * Creates a new API key.
     */
    async createApiKey(request) {
        return this.adminService.createApiKey(request);
    }
    /**
     * Creates a new API key (alias for createApiKey).
     */
    async createApiKeyAsync(request) {
        return this.createApiKey(request);
    }
    /**
     * Lists API keys.
     */
    async listApiKeys() {
        return this.adminService.listApiKeys();
    }
    /**
     * Lists API keys (alias for listApiKeys).
     */
    async listApiKeysAsync() {
        return this.listApiKeys();
    }
    /**
     * Deletes an API key.
     */
    async deleteApiKey(keyId) {
        return this.adminService.deleteApiKey(keyId);
    }
    /**
     * Deletes an API key (alias for deleteApiKey).
     */
    async deleteApiKeyAsync(keyId) {
        return this.deleteApiKey(keyId);
    }
    /**
     * Clears all queues.
     */
    async clearQueues() {
        return this.adminService.clearQueues();
    }
    /**
     * Creates and configures HTTP client with retry logic and error handling.
     */
    createHttpClient() {
        const client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'X-API-Key': this.config.apiKey,
                'X-Tenant-ID': this.config.tenantId,
                'Content-Type': 'application/json',
                'User-Agent': 'sab-nodejs-sdk/2.0.0',
            },
        });
        (0, axios_retry_1.default)(client, {
            retries: this.config.maxRetries,
            retryDelay: (retryCount) => {
                const delay = this.config.retryBackoff * Math.pow(2, retryCount - 1);
                return Math.min(delay, 30000);
            },
            retryCondition: (error) => {
                if (!error.response)
                    return false;
                const status = error.response.status;
                return status >= 500 || status === 429;
            },
        });
        client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                const message = data?.message || `HTTP ${status}`;
                const errorCode = data?.errorCode;
                throw new error_1.SABError(message, errorCode, status, error);
            }
            else if (error.request) {
                throw new error_1.SABError('Network error: No response received', 'NETWORK_ERROR', 0, error);
            }
            else {
                throw new error_1.SABError(`Request setup error: ${error.message}`, 'REQUEST_ERROR', 0, error);
            }
        });
        return client;
    }
}
exports.SabClient = SabClient;
/**
 * Builder class for SabClient with fluent API.
 */
class ClientBuilder {
    constructor() {
        this._config = {};
    }
    baseUrl(url) {
        this._config.baseUrl = url;
        return this;
    }
    apiKey(key) {
        this._config.apiKey = key;
        return this;
    }
    tenantId(tenantId) {
        this._config.tenantId = tenantId;
        return this;
    }
    timeout(timeout) {
        this._config.timeout = timeout;
        return this;
    }
    retry(maxAttempts, backoff) {
        this._config.maxRetries = maxAttempts;
        this._config.retryBackoff = backoff;
        return this;
    }
    config(config) {
        this._config = { ...this._config, ...config };
        return this;
    }
    build() {
        const finalConfig = {
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
            throw new error_1.SABError('API key is required', 'MISSING_API_KEY');
        }
        if (!finalConfig.tenantId) {
            throw new error_1.SABError('Tenant ID is required', 'MISSING_TENANT_ID');
        }
        return new SabClient(finalConfig);
    }
}
exports.ClientBuilder = ClientBuilder;
//# sourceMappingURL=client.js.map