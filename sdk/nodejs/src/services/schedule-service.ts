import { AxiosInstance } from 'axios';
import { Tracer } from '../tracing';
import { SABError } from '../error';
import { ScheduleRequest, ScheduleResponse, ApiResponse } from '../models';

/**
 * Service for handling schedule-related operations.
 */
export class ScheduleService {
  constructor(
    private readonly httpClient: AxiosInstance,
    private readonly tracer: Tracer
  ) {}

  /**
   * Creates a new schedule.
   *
   * @param request the schedule creation request
   * @returns the created schedule response
   */
  public async createSchedule(request: ScheduleRequest): Promise<ScheduleResponse> {
    const span = this.tracer.startSpan('sab.schedule.create', {
      'schedule.cron': request.cron,
      'schedule.jobType': request.jobType,
      'schedule.priority': request.priority || 'NORMAL',
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.post<ApiResponse<ScheduleResponse>>(
        '/api/v1/schedules',
        request
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Schedule creation failed',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('schedule.id', data.data.id);
      return data.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Lists schedules for the current tenant.
   *
   * @returns list of schedule responses
   */
  public async listSchedules(): Promise<ScheduleResponse[]> {
    const span = this.tracer.startSpan('sab.schedules.list');

    const scope = span.makeCurrent();
    try {
      const response =
        await this.httpClient.get<ApiResponse<ScheduleResponse[]>>('/api/v1/schedules');

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to list schedules',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('schedules.count', data.data.length);
      return data.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Cancels a schedule.
   *
   * @param scheduleId the schedule ID to cancel
   * @returns true if cancellation was successful
   */
  public async cancelSchedule(scheduleId: string): Promise<boolean> {
    const span = this.tracer.startSpan('sab.schedule.cancel', {
      'schedule.id': scheduleId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.delete<ApiResponse<void>>(
        `/api/v1/schedules/${scheduleId}`
      );

      const data = response.data;
      if (!data.success) {
        throw new SABError(
          data.message || 'Failed to cancel schedule',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('schedule.cancelled', true);
      return true;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Gets a schedule by its ID.
   *
   * @param scheduleId the schedule ID
   * @returns the schedule response if found, null otherwise
   */
  public async getSchedule(scheduleId: string): Promise<ScheduleResponse | null> {
    const span = this.tracer.startSpan('sab.schedule.get', {
      'schedule.id': scheduleId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.get<ApiResponse<ScheduleResponse>>(
        `/api/v1/schedules/${scheduleId}`
      );

      const data = response.data;
      if (!data.success || !data.data) {
        if (response.status === 404) {
          return null;
        }
        throw new SABError(
          data.message || 'Failed to get schedule',
          data.errorCode,
          response.status
        );
      }

      return data.data;
    } catch (error) {
      if (error instanceof SABError && error.isNotFound) {
        return null;
      }
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Updates a schedule (partial update).
   *
   * @param scheduleId the schedule ID to update
   * @param updates partial update object
   * @returns the updated schedule response
   */
  public async updateSchedule(
    scheduleId: string,
    updates: Partial<ScheduleRequest>
  ): Promise<ScheduleResponse> {
    const span = this.tracer.startSpan('sab.schedule.update', {
      'schedule.id': scheduleId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.patch<ApiResponse<ScheduleResponse>>(
        `/api/v1/schedules/${scheduleId}`,
        updates
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new SABError(
          data.message || 'Failed to update schedule',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('schedule.updated', true);
      return data.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Pauses a schedule.
   *
   * @param scheduleId the schedule ID to pause
   * @returns true if successful
   */
  public async pauseSchedule(scheduleId: string): Promise<boolean> {
    const span = this.tracer.startSpan('sab.schedule.pause', {
      'schedule.id': scheduleId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.post<ApiResponse<void>>(
        `/api/v1/schedules/${scheduleId}/pause`
      );

      const data = response.data;
      if (!data.success) {
        throw new SABError(
          data.message || 'Failed to pause schedule',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('schedule.paused', true);
      return true;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Resumes a schedule.
   *
   * @param scheduleId the schedule ID to resume
   * @returns true if successful
   */
  public async resumeSchedule(scheduleId: string): Promise<boolean> {
    const span = this.tracer.startSpan('sab.schedule.resume', {
      'schedule.id': scheduleId,
    });

    const scope = span.makeCurrent();
    try {
      const response = await this.httpClient.post<ApiResponse<void>>(
        `/api/v1/schedules/${scheduleId}/resume`
      );

      const data = response.data;
      if (!data.success) {
        throw new SABError(
          data.message || 'Failed to resume schedule',
          data.errorCode,
          response.status
        );
      }

      span.setAttribute('schedule.resumed', true);
      return true;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Gets schedules by job type.
   *
   * @param jobType the job type to filter by
   * @returns list of matching schedules
   */
  public async getSchedulesByType(jobType: string): Promise<ScheduleResponse[]> {
    const span = this.tracer.startSpan('sab.schedules.byType', {
      'schedule.jobType': jobType,
    });

    const scope = span.makeCurrent();
    try {
      const allSchedules = await this.listSchedules();
      const filteredSchedules = allSchedules.filter((schedule) => schedule.jobType === jobType);

      span.setAttribute('schedules.filtered.count', filteredSchedules.length);
      return filteredSchedules;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }

  /**
   * Gets active schedules only.
   *
   * @returns list of active schedules
   */
  public async getActiveSchedules(): Promise<ScheduleResponse[]> {
    const span = this.tracer.startSpan('sab.schedules.active');

    const scope = span.makeCurrent();
    try {
      const allSchedules = await this.listSchedules();
      const activeSchedules = allSchedules.filter((schedule) => schedule.active !== false);

      span.setAttribute('schedules.active.count', activeSchedules.length);
      return activeSchedules;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      scope.close();
      span.end();
    }
  }
}
