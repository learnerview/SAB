"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const error_1 = require("../error");
/**
 * Service for handling admin-related operations.
 */
class AdminService {
    constructor(httpClient, tracer) {
        this.httpClient = httpClient;
        this.tracer = tracer;
    }
    /**
     * Gets cluster statistics.
     *
     * @returns cluster statistics
     */
    async getClusterStats() {
        const span = this.tracer.startSpan('sab.admin.cluster.stats');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get('/api/v1/admin/stats');
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to get cluster stats', data.errorCode, response.status);
            }
            span.setAttribute('cluster.jobs.total', data.data.totalJobs || 0);
            span.setAttribute('cluster.jobs.running', data.data.runningJobs || 0);
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
     * Gets queue statistics for the current tenant.
     *
     * @returns queue statistics
     */
    async getQueueStats() {
        const span = this.tracer.startSpan('sab.admin.queue.stats');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get('/api/v1/admin/metrics');
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to get queue stats', data.errorCode, response.status);
            }
            span.setAttribute('queue.jobs.queued', data.data.queued || 0);
            span.setAttribute('queue.jobs.running', data.data.running || 0);
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
     * Lists dead letter queue items.
     *
     * @returns list of DLQ items
     */
    async listDLQ() {
        const span = this.tracer.startSpan('sab.admin.dlq.list');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get('/api/v1/admin/dlq');
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to list DLQ', data.errorCode, response.status);
            }
            span.setAttribute('dlq.items.count', data.data.length);
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
     * Retries a job from the dead letter queue.
     *
     * @param jobId the job ID to retry
     * @returns true if retry was successful
     */
    async retryDLQJob(jobId) {
        const span = this.tracer.startSpan('sab.admin.dlq.retry', {
            'job.id': jobId,
        });
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.post(`/api/v1/admin/dlq/${jobId}/retry`);
            const data = response.data;
            if (!data.success) {
                throw new error_1.SABError(data.message || 'Failed to retry DLQ job', data.errorCode, response.status);
            }
            span.setAttribute('job.retried', true);
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
     * Creates a new API key.
     *
     * @param request the API key creation request
     * @returns the created API key info
     */
    async createApiKey(request) {
        const span = this.tracer.startSpan('sab.admin.keys.create', {
            'key.label': request.label,
        });
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.post('/api/v1/admin/keys', request);
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to create API key', data.errorCode, response.status);
            }
            span.setAttribute('key.id', data.data.id);
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
     * Lists API keys.
     *
     * @returns list of API keys
     */
    async listApiKeys() {
        const span = this.tracer.startSpan('sab.admin.keys.list');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.get('/api/v1/admin/keys');
            const data = response.data;
            if (!data.success || !data.data) {
                throw new error_1.SABError(data.message || 'Failed to list API keys', data.errorCode, response.status);
            }
            span.setAttribute('keys.count', data.data.length);
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
     * Deletes an API key.
     *
     * @param keyId the key ID to delete
     * @returns true if deletion was successful
     */
    async deleteApiKey(keyId) {
        const span = this.tracer.startSpan('sab.admin.keys.delete', {
            'key.id': keyId,
        });
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.delete(`/api/v1/admin/keys/${keyId}`);
            const data = response.data;
            if (!data.success) {
                throw new error_1.SABError(data.message || 'Failed to delete API key', data.errorCode, response.status);
            }
            span.setAttribute('key.deleted', true);
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
     * Clears all queues.
     *
     * @returns true if successful
     */
    async clearQueues() {
        const span = this.tracer.startSpan('sab.admin.queues.clear');
        const scope = span.makeCurrent();
        try {
            const response = await this.httpClient.delete('/api/v1/admin/queues');
            const data = response.data;
            if (!data.success) {
                throw new error_1.SABError(data.message || 'Failed to clear queues', data.errorCode, response.status);
            }
            span.setAttribute('queues.cleared', true);
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
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin-service.js.map