import { AxiosInstance } from 'axios';
import { Tracer } from '../tracing';
import { ClusterStats, QueueStats, DLQItem, ApiKeyRequest, ApiKeyInfo } from '../models';
/**
 * Service for handling admin-related operations.
 */
export declare class AdminService {
    private readonly httpClient;
    private readonly tracer;
    constructor(httpClient: AxiosInstance, tracer: Tracer);
    /**
     * Gets cluster statistics.
     *
     * @returns cluster statistics
     */
    getClusterStats(): Promise<ClusterStats>;
    /**
     * Gets queue statistics for the current tenant.
     *
     * @returns queue statistics
     */
    getQueueStats(): Promise<QueueStats>;
    /**
     * Lists dead letter queue items.
     *
     * @returns list of DLQ items
     */
    listDLQ(): Promise<DLQItem[]>;
    /**
     * Retries a job from the dead letter queue.
     *
     * @param jobId the job ID to retry
     * @returns true if retry was successful
     */
    retryDLQJob(jobId: string): Promise<boolean>;
    /**
     * Creates a new API key.
     *
     * @param request the API key creation request
     * @returns the created API key info
     */
    createApiKey(request: ApiKeyRequest): Promise<ApiKeyInfo>;
    /**
     * Lists API keys.
     *
     * @returns list of API keys
     */
    listApiKeys(): Promise<ApiKeyInfo[]>;
    /**
     * Deletes an API key.
     *
     * @param keyId the key ID to delete
     * @returns true if deletion was successful
     */
    deleteApiKey(keyId: string): Promise<boolean>;
    /**
     * Clears all queues.
     *
     * @returns true if successful
     */
    clearQueues(): Promise<boolean>;
}
//# sourceMappingURL=admin-service.d.ts.map