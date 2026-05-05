import { AxiosInstance } from 'axios';
import { Tracer } from '../tracing';
import { ScheduleRequest, ScheduleResponse } from '../models';
/**
 * Service for handling schedule-related operations.
 */
export declare class ScheduleService {
    private readonly httpClient;
    private readonly tracer;
    constructor(httpClient: AxiosInstance, tracer: Tracer);
    /**
     * Creates a new schedule.
     *
     * @param request the schedule creation request
     * @returns the created schedule response
     */
    createSchedule(request: ScheduleRequest): Promise<ScheduleResponse>;
    /**
     * Lists schedules for the current tenant.
     *
     * @returns list of schedule responses
     */
    listSchedules(): Promise<ScheduleResponse[]>;
    /**
     * Cancels a schedule.
     *
     * @param scheduleId the schedule ID to cancel
     * @returns true if cancellation was successful
     */
    cancelSchedule(scheduleId: string): Promise<boolean>;
    /**
     * Gets a schedule by its ID.
     *
     * @param scheduleId the schedule ID
     * @returns the schedule response if found, null otherwise
     */
    getSchedule(scheduleId: string): Promise<ScheduleResponse | null>;
    /**
     * Updates a schedule (partial update).
     *
     * @param scheduleId the schedule ID to update
     * @param updates partial update object
     * @returns the updated schedule response
     */
    updateSchedule(scheduleId: string, updates: Partial<ScheduleRequest>): Promise<ScheduleResponse>;
    /**
     * Pauses a schedule.
     *
     * @param scheduleId the schedule ID to pause
     * @returns true if successful
     */
    pauseSchedule(scheduleId: string): Promise<boolean>;
    /**
     * Resumes a schedule.
     *
     * @param scheduleId the schedule ID to resume
     * @returns true if successful
     */
    resumeSchedule(scheduleId: string): Promise<boolean>;
    /**
     * Gets schedules by job type.
     *
     * @param jobType the job type to filter by
     * @returns list of matching schedules
     */
    getSchedulesByType(jobType: string): Promise<ScheduleResponse[]>;
    /**
     * Gets active schedules only.
     *
     * @returns list of active schedules
     */
    getActiveSchedules(): Promise<ScheduleResponse[]>;
}
//# sourceMappingURL=schedule-service.d.ts.map