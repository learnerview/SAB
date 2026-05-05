//Common enums and types used across the SDK.
//Job priority levels.

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH';
//Job status values.

export type JobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRY_SCHEDULED'
  | 'DLQ'
  | 'CANCELLED';
//Execution type values.

export type ExecutionType = 'HTTP' | 'WEBHOOK';
//Generic API response wrapper.

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  timestamp?: number;
}
//Generic list response wrapper.

export interface ListResponse<T = any> extends ApiResponse<T[]> {
  // Inherits from ApiResponse<T[]>
}
//Execution policy configuration.

export interface ExecutionPolicy {
  type: ExecutionType;
  endpoint: string;
  timeoutSeconds?: number;
  callbackUrl?: string;
  headers?: Record<string, string>;
  retryPolicy?: RetryPolicy;
}
//Retry policy configuration.

export interface RetryPolicy {
  maxAttempts?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  multiplier?: number;
  useJitter?: boolean;
}
//Memory usage information.

export interface MemoryInfo {
  totalBytes?: number;
  usedBytes?: number;
  freeBytes?: number;
  usagePercentage?: number;
}
//CPU usage information.

export interface CpuInfo {
  usagePercentage?: number;
  availableProcessors?: number;
  systemLoadAverage?: number;
}
//Lease information for jobs.

export interface LeaseInfo {
  owner?: string;
  token?: string;
  expiresAt?: string;
  visibleAt?: string;
}
