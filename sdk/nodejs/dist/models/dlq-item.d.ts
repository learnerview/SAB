import { JobPriority, JobStatus } from './common';
/**
 * Dead Letter Queue item information.
 */
export interface DLQItem {
    jobId: string;
    jobType: string;
    priority: JobPriority;
    status: JobStatus;
    payload?: Record<string, any>;
    errorMessage?: string;
    attemptCount?: number;
    maxAttempts?: number;
    createdAt?: string;
    failedAt?: string;
    tenantId?: string;
}
/**
 * Helper function to check if a DLQ item has exhausted retries.
 */
export declare function hasExhaustedRetries(item: DLQItem): boolean;
/**
 * Helper function to get time since failure.
 */
export declare function getTimeSinceFailure(item: DLQItem): number | null;
/**
 * Helper function to format failure time.
 */
export declare function formatFailureTime(item: DLQItem): string;
/**
 * Helper function to get retry attempt summary.
 */
export declare function getRetrySummary(item: DLQItem): string;
/**
 * Helper function to check if DLQ item is recent.
 */
export declare function isRecentFailure(item: DLQItem): boolean;
/**
 * Helper function to check if DLQ item is old.
 */
export declare function isOldFailure(item: DLQItem): boolean;
/**
 * Helper function to categorize DLQ items by error type.
 */
export declare function categorizeByError(items: DLQItem[]): Record<string, DLQItem[]>;
//# sourceMappingURL=dlq-item.d.ts.map