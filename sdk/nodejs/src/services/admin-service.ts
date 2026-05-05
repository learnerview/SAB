import { AxiosInstance } from 'axios';
import { Tracer } from '../tracing';
import { SABError } from '../error';
import {
  ClusterStats,
  QueueStats,
  DLQItem,
  ApiKeyRequest,
  ApiKeyInfo,
  ApiResponse,
} from '../models';

/**
 * Service for handling admin-related operations.
 */
export class AdminService {
  constructor(
    private readonly httpClient: AxiosInstance,
    private readonly tracer: Tracer
  ) {}

  /**
   * Gets cluster statistics.
   *
   * @returns cluster statistics
   */
  public async getClusterStats(): Promise<ClusterStats> {
    const span = this.tracer.startSpan('sab.admin.cluster.stats');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<ClusterStats>>('/api/v1/admin/stats');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to get cluster stats',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('cluster.jobs.total', data.data.totalJobs || 0);
      span.setAttribute('cluster.jobs.running', data.data.runningJobs || 0);
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
   * Gets queue statistics for the current tenant.
   *
   * @returns queue statistics
   */
  public async getQueueStats(): Promise<QueueStats> {
    const span = this.tracer.startSpan('sab.admin.queue.stats');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<QueueStats>>('/api/v1/admin/metrics');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to get queue stats',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('queue.jobs.queued', data.data.queued || 0);
      span.setAttribute('queue.jobs.running', data.data.running || 0);
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
   * Lists dead letter queue items.
   *
   * @returns list of DLQ items
   */
  public async listDLQ(): Promise<DLQItem[]> {
    const span = this.tracer.startSpan('sab.admin.dlq.list');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<DLQItem[]>>('/api/v1/admin/dlq');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(data.message || 'Failed to list DLQ', data.errorCode, response.status);
      }

      span.setAttribute('dlq.items.count', data.data.length);
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
   * Retries a job from the dead letter queue.
   *
   * @param jobId the job ID to retry
   * @returns true if retry was successful
   */
  public async retryDLQJob(jobId: string): Promise<boolean> {
    const span = this.tracer.startSpan('sab.admin.dlq.retry', {
      'job.id': jobId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.post<ApiResponse<void>>(
        `/api/v1/admin/dlq/${jobId}/retry`
      );

      const data = response.data;
      if (!data.success) {
        throw new SABError(
          data.message || 'Failed to retry DLQ job',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('job.retried', true);
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
   * Creates a new API key.
   *
   * @param request the API key creation request
   * @returns the created API key info
   */
  public async createApiKey(request: ApiKeyRequest): Promise<ApiKeyInfo> {
    const span = this.tracer.startSpan('sab.admin.keys.create', {
      'key.label': request.label,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.post<ApiResponse<ApiKeyInfo>>(
        '/api/v1/admin/keys',
        request
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to create API key',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('key.id', data.data.id);
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
   * Lists API keys.
   *
   * @returns list of API keys
   */
  public async listApiKeys(): Promise<ApiKeyInfo[]> {
    const span = this.tracer.startSpan('sab.admin.keys.list');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<ApiKeyInfo[]>>('/api/v1/admin/keys');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to list API keys',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('keys.count', data.data.length);
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
   * Deletes an API key.
   *
   * @param keyId the key ID to delete
   * @returns true if deletion was successful
   */
  public async deleteApiKey(keyId: string): Promise<boolean> {
    const span = this.tracer.startSpan('sab.admin.keys.delete', {
      'key.id': keyId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.delete<ApiResponse<void>>(
        `/api/v1/admin/keys/${keyId}`
      );

      const data = response.data;
      if (!data.success) {
        throw new SABError(
          data.message || 'Failed to delete API key',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('key.deleted', true);
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
   * Clears all queues.
   *
   * @returns true if successful
   */
  public async clearQueues(): Promise<boolean> {
    const span = this.tracer.startSpan('sab.admin.queues.clear');

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.delete<ApiResponse<void>>('/api/v1/admin/queues');

      const data = response.data;
      if (!data.success) {
        throw new SABError(
          data.message || 'Failed to clear queues',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('queues.cleared', true);
      return true;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }
}
