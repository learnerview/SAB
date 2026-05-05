import { ExecutionPolicy, JobPriority } from './common';
export interface ScheduleResponse {
    id: string;
    cron: string;
    jobType: string;
    priority?: JobPriority;
    payload?: Record<string, any>;
    execution?: ExecutionPolicy;
    maxAttempts?: number;
    createdAt?: string;
    nextRunAt?: string;
    active?: boolean;
    tenantId?: string;
}
export declare function isScheduleActive(schedule: ScheduleResponse): boolean;
export declare function getNextExecutionTime(schedule: ScheduleResponse): Date | null;
export declare function getTimeUntilNextExecution(schedule: ScheduleResponse): number | null;
export declare function isNextExecutionWithin(schedule: ScheduleResponse, windowMs: number): boolean;
//# sourceMappingURL=schedule-response.d.ts.map