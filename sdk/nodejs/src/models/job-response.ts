import { ExecutionPolicy, JobPriority, JobStatus, LeaseInfo } from './common';
//Response object for job information.

export interface JobResponse {
  //Unique job identifier.

  jobId: string;
  //Job type.

  jobType: string;
  //Job priority.

  priority: JobPriority;
  //Current job status.

  status: JobStatus;
  //Job payload data.

  payload?: Record<string, any>;
  //Execution policy.

  execution?: ExecutionPolicy;
  //Maximum retry attempts.

  maxAttempts?: number;
  //Current attempt number.

  attemptCount?: number;
  //Job creation timestamp (ISO string).

  createdAt?: string;
  //Scheduled execution timestamp (ISO string).

  scheduledAt?: string;
  //Job start timestamp (ISO string).

  startedAt?: string;
  //Job completion timestamp (ISO string).

  completedAt?: string;
  //Next retry timestamp (ISO string).

  nextRetryAt?: string;
  //Error message (if failed).

  errorMessage?: string;
  //Job result data.

  result?: Record<string, any>;
  //Job tags.

  tags?: Record<string, string>;
  //Callback URL.

  callbackUrl?: string;
  //Tenant ID.

  tenantId?: string;
  //Worker ID that processed the job.

  workerId?: string;
  //Lease information.

  lease?: LeaseInfo;
}
//Helper function to check if a job is running.

export function isJobRunning(job: JobResponse): boolean {
  return job.status === 'RUNNING';
}
//Helper function to check if a job is completed successfully.

export function isJobSuccessful(job: JobResponse): boolean {
  return job.status === 'SUCCESS';
}
//Helper function to check if a job failed.

export function isJobFailed(job: JobResponse): boolean {
  return job.status === 'FAILED' || job.status === 'DLQ';
}
//Helper function to check if a job is queued.

export function isJobQueued(job: JobResponse): boolean {
  return job.status === 'QUEUED';
}
//Helper function to check if a job is retrying.

export function isJobRetrying(job: JobResponse): boolean {
  return job.status === 'RETRY_SCHEDULED';
}
//Helper function to get job duration in milliseconds.

export function getJobDuration(job: JobResponse): number | null {
  if (!job.startedAt || !job.completedAt) {
    return null;
  }

  const start = new Date(job.startedAt).getTime();
  const end = new Date(job.completedAt).getTime();
  return end - start;
}
//Helper function to get job wait time in milliseconds.

export function getJobWaitTime(job: JobResponse): number | null {
  if (!job.createdAt || !job.startedAt) {
    return null;
  }

  const created = new Date(job.createdAt).getTime();
  const started = new Date(job.startedAt).getTime();
  return started - created;
}
