import { ExecutionPolicy, JobPriority } from './common';
export interface ScheduleRequest {
    cron: string;
    jobType: string;
    priority?: JobPriority;
    payload?: Record<string, any>;
    execution?: ExecutionPolicy;
    maxAttempts?: number;
}
export declare function createScheduleRequest(cron: string, jobType: string, priority?: JobPriority): ScheduleRequest;
export declare function createWebhookScheduleRequest(cron: string, endpoint: string, payload?: Record<string, any>, priority?: JobPriority, timeoutSeconds?: number): ScheduleRequest;
export declare function createDailySchedule(jobType: string, hour?: number, minute?: number, priority?: JobPriority): ScheduleRequest;
export declare function createHourlySchedule(jobType: string, minute?: number, priority?: JobPriority): ScheduleRequest;
export declare function createWeeklySchedule(jobType: string, dayOfWeek: number, // 0 = Sunday, 6 = Saturday
hour?: number, minute?: number, priority?: JobPriority): ScheduleRequest;
export declare function createMonthlySchedule(jobType: string, dayOfMonth?: number, hour?: number, minute?: number, priority?: JobPriority): ScheduleRequest;
//# sourceMappingURL=schedule-request.d.ts.map