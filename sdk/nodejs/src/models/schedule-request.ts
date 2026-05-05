import { ExecutionPolicy, JobPriority } from './common';
//Request object for creating a schedule.

export interface ScheduleRequest {
  //Cron expression for schedule timing.

  cron: string;
  //Job type to execute.

  jobType: string;
  //Job priority level.

  priority?: JobPriority;
  //Payload data for the job.

  payload?: Record<string, any>;
  //Execution policy for the job.

  execution?: ExecutionPolicy;
  //Maximum number of retry attempts.

  maxAttempts?: number;
}
//Helper function to create a schedule request.

export function createScheduleRequest(
  cron: string,
  jobType: string,
  priority: JobPriority = 'NORMAL'
): ScheduleRequest {
  return {
    cron,
    jobType,
    priority,
  };
}
//Helper function to create a webhook schedule request.

export function createWebhookScheduleRequest(
  cron: string,
  endpoint: string,
  payload?: Record<string, any>,
  priority: JobPriority = 'NORMAL',
  timeoutSeconds: number = 30
): ScheduleRequest {
  return {
    cron,
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
//Helper function to create a daily schedule.

export function createDailySchedule(
  jobType: string,
  hour: number = 0,
  minute: number = 0,
  priority: JobPriority = 'NORMAL'
): ScheduleRequest {
  const cron = `${minute} ${hour} * * *`;
  return createScheduleRequest(cron, jobType, priority);
}
//Helper function to create an hourly schedule.

export function createHourlySchedule(
  jobType: string,
  minute: number = 0,
  priority: JobPriority = 'NORMAL'
): ScheduleRequest {
  const cron = `${minute} * * * *`;
  return createScheduleRequest(cron, jobType, priority);
}
//Helper function to create a weekly schedule.

export function createWeeklySchedule(
  jobType: string,
  dayOfWeek: number, // 0 = Sunday, 6 = Saturday
  hour: number = 0,
  minute: number = 0,
  priority: JobPriority = 'NORMAL'
): ScheduleRequest {
  const cron = `${minute} ${hour} * * ${dayOfWeek}`;
  return createScheduleRequest(cron, jobType, priority);
}
//Helper function to create a monthly schedule.

export function createMonthlySchedule(
  jobType: string,
  dayOfMonth: number = 1,
  hour: number = 0,
  minute: number = 0,
  priority: JobPriority = 'NORMAL'
): ScheduleRequest {
  const cron = `${minute} ${hour} ${dayOfMonth} * *`;
  return createScheduleRequest(cron, jobType, priority);
}
