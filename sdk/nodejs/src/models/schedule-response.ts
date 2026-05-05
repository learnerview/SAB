import { ExecutionPolicy, JobPriority } from './common';
//Response object for schedule information.

export interface ScheduleResponse {
  //Unique schedule identifier.

  id: string;
  //Cron expression.

  cron: string;
  //Job type.

  jobType: string;
  //Job priority.

  priority?: JobPriority;
  //Job payload data.

  payload?: Record<string, any>;
  //Execution policy.

  execution?: ExecutionPolicy;
  //Maximum retry attempts.

  maxAttempts?: number;
  //Schedule creation timestamp (ISO string).

  createdAt?: string;
  //Next execution timestamp (ISO string).

  nextRunAt?: string;
  //Whether the schedule is active.

  active?: boolean;
  //Tenant ID.

  tenantId?: string;
}
//Helper function to check if a schedule is active.

export function isScheduleActive(schedule: ScheduleResponse): boolean {
  return schedule.active === true;
}
//Helper function to get next execution time as Date object.

export function getNextExecutionTime(schedule: ScheduleResponse): Date | null {
  if (!schedule.nextRunAt) {
    return null;
  }
  return new Date(schedule.nextRunAt);
}
//Helper function to get time until next execution in milliseconds.

export function getTimeUntilNextExecution(schedule: ScheduleResponse): number | null {
  const nextTime = getNextExecutionTime(schedule);
  if (!nextTime) {
    return null;
  }
  return nextTime.getTime() - Date.now();
}
//Helper function to check if next execution is within a time window.

export function isNextExecutionWithin(schedule: ScheduleResponse, windowMs: number): boolean {
  const timeUntil = getTimeUntilNextExecution(schedule);
  if (timeUntil === null || timeUntil < 0) {
    return false;
  }
  return timeUntil <= windowMs;
}
