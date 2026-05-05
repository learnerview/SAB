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
export function hasExhaustedRetries(item: DLQItem): boolean {
  const { attemptCount = 0, maxAttempts = 0 } = item;
  return attemptCount >= maxAttempts;
}

/**
 * Helper function to get time since failure.
 */
export function getTimeSinceFailure(item: DLQItem): number | null {
  if (!item.failedAt) {
    return null;
  }

  const failedAt = new Date(item.failedAt).getTime();
  return Date.now() - failedAt;
}

/**
 * Helper function to format failure time.
 */
export function formatFailureTime(item: DLQItem): string {
  if (!item.failedAt) {
    return 'Unknown';
  }

  const timeSince = getTimeSinceFailure(item);
  if (timeSince === null) {
    return 'Unknown';
  }

  const minutes = Math.floor(timeSince / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ago`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ago`;
  }

  return 'Just now';
}

/**
 * Helper function to get retry attempt summary.
 */
export function getRetrySummary(item: DLQItem): string {
  const { attemptCount = 0, maxAttempts = 0 } = item;
  return `${attemptCount}/${maxAttempts}`;
}

/**
 * Helper function to check if DLQ item is recent.
 */
export function isRecentFailure(item: DLQItem): boolean {
  const timeSince = getTimeSinceFailure(item);
  return timeSince !== null && timeSince < 60 * 60 * 1000; // 1 hour
}

/**
 * Helper function to check if DLQ item is old.
 */
export function isOldFailure(item: DLQItem): boolean {
  const timeSince = getTimeSinceFailure(item);
  return timeSince !== null && timeSince > 24 * 60 * 60 * 1000; // 24 hours
}

/**
 * Helper function to categorize DLQ items by error type.
 */
export function categorizeByError(items: DLQItem[]): Record<string, DLQItem[]> {
  return items.reduce(
    (categories, item) => {
      const error = item.errorMessage || 'Unknown';
      const category = getErrorCategory(error);

      let categoryItems = categories[category];
      if (!categoryItems) {
        categoryItems = [];
        categories[category] = categoryItems;
      }

      categoryItems.push(item);
      return categories;
    },
    {} as Record<string, DLQItem[]>
  );
}

/**
 * Helper function to categorize error by type.
 */
function getErrorCategory(errorMessage: string): string {
  const message = errorMessage.toLowerCase();

  if (message.includes('timeout')) return 'Timeout';
  if (message.includes('connection') || message.includes('network')) return 'Network';
  if (message.includes('401') || message.includes('unauthorized')) return 'Authentication';
  if (message.includes('403') || message.includes('forbidden')) return 'Authorization';
  if (message.includes('404') || message.includes('not found')) return 'Not Found';
  if (message.includes('429') || message.includes('rate limit')) return 'Rate Limit';
  if (message.includes('500') || message.includes('server error')) return 'Server Error';
  if (message.includes('validation') || message.includes('invalid')) return 'Validation';

  return 'Other';
}
