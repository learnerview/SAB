import { ExecutionPolicy, JobPriority, RetryPolicy } from './common';
//Request object for submitting a job.

export interface JobSubmissionRequest {
  //The type of job to execute.

  jobType: string;
  //Job priority level.

  priority: JobPriority;
  //Payload data for the job.

  payload?: Record<string, any>;
  //Execution policy for the job.

  execution?: ExecutionPolicy;
  //Maximum number of retry attempts.

  maxAttempts?: number;
  //Unique identifier for idempotency.

  idempotencyKey?: string;
  //Delay before executing the job (in milliseconds).

  delay?: number;
  //Time-to-live for the job (in milliseconds).

  ttl?: number;
  //Tags for job categorization.

  tags?: Record<string, string>;
  //Callback URL for job completion notifications.

  callbackUrl?: string;
}
//Helper function to create a job submission request.

export function createJobSubmissionRequest(
  jobType: string,
  priority: JobPriority = 'NORMAL'
): JobSubmissionRequest {
  return {
    jobType,
    priority,
  };
}
//Helper function to create a webhook job submission request.

export function createWebhookJobRequest(
  endpoint: string,
  payload?: Record<string, any>,
  priority: JobPriority = 'NORMAL',
  timeoutSeconds: number = 30
): JobSubmissionRequest {
  return {
    jobType: 'webhook',
    priority,
    payload,
    execution: {
      type: 'HTTP',
      endpoint,
      timeoutSeconds,
    },
  };
}
//Helper function to create a job with retry policy.

export function createJobWithRetry(
  jobType: string,
  priority: JobPriority,
  maxAttempts: number,
  retryPolicy: RetryPolicy
): JobSubmissionRequest {
  return {
    jobType,
    priority,
    maxAttempts,
    execution: {
      type: 'HTTP',
      endpoint: '',
      retryPolicy,
    },
  };
}
