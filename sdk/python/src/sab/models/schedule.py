"""
Schedule-related models for SAB SDK.
"""

from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from .common import (
    JobPriority,
    ExecutionPolicy,
)


class ScheduleRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Request object for creating a schedule."""
    cron: str
    job_type: str = Field(..., alias="jobType")
    priority: Optional[JobPriority] = JobPriority.NORMAL
    payload: Optional[Dict[str, Any]] = None
    execution: Optional[ExecutionPolicy] = None
    max_attempts: Optional[int] = Field(None, alias="maxAttempts")


class ScheduleResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Response object for schedule information."""
    id: str
    cron: str
    job_type: str = Field(..., alias="jobType")
    priority: Optional[JobPriority] = JobPriority.NORMAL
    payload: Optional[Dict[str, Any]] = None
    execution: Optional[ExecutionPolicy] = None
    max_attempts: Optional[int] = Field(None, alias="maxAttempts")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    next_run_at: Optional[datetime] = Field(None, alias="nextRunAt")
    active: Optional[bool] = True
    tenant_id: Optional[str] = Field(None, alias="tenantId")
# Helper functions for schedule operations
def is_schedule_active(schedule: ScheduleResponse) -> bool:
    """Check if a schedule is active."""
    return schedule.active is True


def get_next_execution_time(schedule: ScheduleResponse) -> Optional[datetime]:
    """Get next execution time as datetime object."""
    return schedule.next_run_at


def get_time_until_next_execution(schedule: ScheduleResponse) -> Optional[float]:
    """Get time until next execution in milliseconds."""
    next_time = get_next_execution_time(schedule)
    if not next_time:
        return None
    
    now = datetime.now().timestamp() * 1000
    next_timestamp = next_time.timestamp() * 1000
    return next_timestamp - now


def is_next_execution_within(schedule: ScheduleResponse, window_ms: float) -> bool:
    """Check if next execution is within a time window."""
    time_until = get_time_until_next_execution(schedule)
    if time_until is None or time_until < 0:
        return False
    return time_until <= window_ms


def create_schedule_request(
    cron: str,
    job_type: str,
    priority: JobPriority = JobPriority.NORMAL
) -> ScheduleRequest:
    """Create a schedule request."""
    return ScheduleRequest(cron=cron, job_type=job_type, priority=priority)


def create_webhook_schedule_request(
    cron: str,
    endpoint: str,
    payload: Optional[Dict[str, Any]] = None,
    priority: JobPriority = JobPriority.NORMAL,
    timeout_seconds: int = 30
) -> ScheduleRequest:
    """Create a webhook schedule request."""
    return ScheduleRequest(
        cron=cron,
        job_type="webhook",
        priority=priority,
        payload=payload,
        execution=ExecutionPolicy(
            type=ExecutionType.HTTP,
            endpoint=endpoint,
            timeout_seconds=timeout_seconds
        )
    )


def create_daily_schedule(
    job_type: str,
    hour: int = 0,
    minute: int = 0,
    priority: JobPriority = JobPriority.NORMAL
) -> ScheduleRequest:
    """Create a daily schedule."""
    cron = f"{minute} {hour} * * *"
    return create_schedule_request(cron, job_type, priority)


def create_hourly_schedule(
    job_type: str,
    minute: int = 0,
    priority: JobPriority = JobPriority.NORMAL
) -> ScheduleRequest:
    """Create an hourly schedule."""
    cron = f"{minute} * * * *"
    return create_schedule_request(cron, job_type, priority)


def create_weekly_schedule(
    job_type: str,
    day_of_week: int,  # 0 = Sunday, 6 = Saturday
    hour: int = 0,
    minute: int = 0,
    priority: JobPriority = JobPriority.NORMAL
) -> ScheduleRequest:
    """Create a weekly schedule."""
    cron = f"{minute} {hour} * * {day_of_week}"
    return create_schedule_request(cron, job_type, priority)


def create_monthly_schedule(
    job_type: str,
    day_of_month: int = 1,
    hour: int = 0,
    minute: int = 0,
    priority: JobPriority = JobPriority.NORMAL
) -> ScheduleRequest:
    """Create a monthly schedule."""
    cron = f"{minute} {hour} {day_of_month} * *"
    return create_schedule_request(cron, job_type, priority)



