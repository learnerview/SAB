"""
Job-related models for SAB SDK.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from .common import (
    JobPriority,
    JobStatus,
    ExecutionPolicy,
    RetryPolicy,
    LeaseInfo,
)


class JobSubmissionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Request object for submitting a job."""
    job_type: str = Field(..., alias="jobType")
    priority: JobPriority = JobPriority.NORMAL
    payload: Optional[Dict[str, Any]] = None
    execution: Optional[ExecutionPolicy] = None
    max_attempts: Optional[int] = Field(None, alias="maxAttempts")
    idempotency_key: Optional[str] = Field(None, alias="idempotencyKey")
    delay: Optional[int] = None
    ttl: Optional[int] = None
    tags: Optional[Dict[str, str]] = None
    callback_url: Optional[str] = Field(None, alias="callbackUrl")


class JobResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Response object for job information."""
    job_id: str = Field(..., alias="jobId")
    job_type: Optional[str] = Field(None, alias="jobType")
    priority: Optional[JobPriority] = JobPriority.NORMAL
    status: JobStatus
    payload: Optional[Dict[str, Any]] = None
    execution: Optional[ExecutionPolicy] = None
    max_attempts: Optional[int] = Field(None, alias="maxAttempts")
    attempt_count: Optional[int] = Field(None, alias="attemptCount")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    scheduled_at: Optional[datetime] = Field(None, alias="scheduledAt")
    started_at: Optional[datetime] = Field(None, alias="startedAt")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    next_retry_at: Optional[datetime] = Field(None, alias="nextRetryAt")
    error_message: Optional[str] = Field(None, alias="errorMessage")
    result: Optional[Dict[str, Any]] = None
    tags: Optional[Dict[str, str]] = None
    callback_url: Optional[str] = Field(None, alias="callbackUrl")
    tenant_id: Optional[str] = Field(None, alias="tenantId")
    worker_id: Optional[str] = Field(None, alias="workerId")
    lease: Optional[LeaseInfo] = None


class JobHealth(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Job health information."""
    queued: Optional[int] = None
    running: Optional[int] = None
    success: Optional[int] = None
    failed: Optional[int] = None
    dlq: Optional[int] = None
    success_rate: Optional[float] = Field(None, alias="successRate")
    avg_execution_time_ms: Optional[float] = Field(None, alias="avgExecutionTimeMs")
    avg_wait_time_ms: Optional[float] = Field(None, alias="avgWaitTimeMs")
    throughput: Optional[float] = None
# Helper functions for job operations
def is_job_running(job: JobResponse) -> bool:
    """Check if a job is running."""
    return job.status == JobStatus.RUNNING


def is_job_successful(job: JobResponse) -> bool:
    """Check if a job is completed successfully."""
    return job.status == JobStatus.SUCCESS


def is_job_failed(job: JobResponse) -> bool:
    """Check if a job failed."""
    return job.status in (JobStatus.FAILED, JobStatus.DLQ)


def is_job_queued(job: JobResponse) -> bool:
    """Check if a job is queued."""
    return job.status == JobStatus.QUEUED


def is_job_retrying(job: JobResponse) -> bool:
    """Check if a job is retrying."""
    return job.status == JobStatus.RETRY_SCHEDULED


def get_job_duration(job: JobResponse) -> Optional[float]:
    """Get job duration in milliseconds."""
    if not job.started_at or not job.completed_at:
        return None
    
    start = job.started_at.timestamp() * 1000
    end = job.completed_at.timestamp() * 1000
    return end - start


def get_job_wait_time(job: JobResponse) -> Optional[float]:
    """Get job wait time in milliseconds."""
    if not job.created_at or not job.started_at:
        return None
    
    created = job.created_at.timestamp() * 1000
    started = job.started_at.timestamp() * 1000
    return started - created


def create_job_submission_request(
    job_type: str,
    priority: JobPriority = JobPriority.NORMAL
) -> JobSubmissionRequest:
    """Create a job submission request."""
    return JobSubmissionRequest(job_type=job_type, priority=priority)


def create_webhook_job_request(
    endpoint: str,
    payload: Optional[Dict[str, Any]] = None,
    priority: JobPriority = JobPriority.NORMAL,
    timeout_seconds: int = 30
) -> JobSubmissionRequest:
    """Create a webhook job submission request."""
    return JobSubmissionRequest(
        job_type="webhook",
        priority=priority,
        payload=payload,
        execution=ExecutionPolicy(
            type=ExecutionType.HTTP,
            endpoint=endpoint,
            timeout_seconds=timeout_seconds
        )
    )


def create_job_with_retry(
    job_type: str,
    priority: JobPriority,
    max_attempts: int,
    retry_policy: RetryPolicy
) -> JobSubmissionRequest:
    """Create a job with retry policy."""
    return JobSubmissionRequest(
        job_type=job_type,
        priority=priority,
        max_attempts=max_attempts,
        execution=ExecutionPolicy(
            type=ExecutionType.HTTP,
            endpoint="",
            retry_policy=retry_policy
        )
    )


def get_total_processed(health: JobHealth) -> int:
    """Calculate total jobs processed."""
    return (health.success or 0) + (health.failed or 0) + (health.dlq or 0)


def calculate_success_rate(health: JobHealth) -> Optional[float]:
    """Calculate success rate."""
    success = health.success or 0
    failed = health.failed or 0
    dlq = health.dlq or 0
    total = success + failed + dlq
    
    if total == 0:
        return None
    
    return (success / total) * 100


def calculate_failure_rate(health: JobHealth) -> Optional[float]:
    """Calculate failure rate."""
    success = health.success or 0
    failed = health.failed or 0
    dlq = health.dlq or 0
    total = success + failed + dlq
    
    if total == 0:
        return None
    
    return ((failed + dlq) / total) * 100


def get_health_status(health: JobHealth) -> str:
    """Get health status."""
    total_processed = get_total_processed(health)
    queued = health.queued or 0
    running = health.running or 0
    success_rate = calculate_success_rate(health)
    wait_time = health.avg_wait_time_ms or 0
# Idle state
    if total_processed == 0 and queued == 0 and running == 0:
        return "IDLE"
# Critical conditions
    if wait_time > 300000 or queued > 1000 or (success_rate is not None and success_rate < 80):
        return "CRITICAL"
# Warning conditions
    if wait_time > 120000 or queued > 500 or (success_rate is not None and success_rate < 90):
        return "WARNING"
    
    return "HEALTHY"


def format_execution_time(execution_time_ms: float) -> str:
    """Format execution time."""
    if execution_time_ms < 1000:
        return f"{round(execution_time_ms)}ms"
    
    seconds = execution_time_ms / 1000
    if seconds < 60:
        return f"{seconds:.1f}s"
    
    minutes = seconds / 60
    return f"{minutes:.1f}m"


def format_wait_time(wait_time_ms: float) -> str:
    """Format wait time."""
    if wait_time_ms < 1000:
        return f"{round(wait_time_ms)}ms"
    
    seconds = wait_time_ms / 1000
    if seconds < 60:
        return f"{seconds:.1f}s"
    
    minutes = seconds / 60
    if minutes < 60:
        return f"{minutes:.1f}m"
    
    hours = minutes / 60
    return f"{hours:.1f}h"


def format_throughput(throughput: float) -> str:
    """Format throughput."""
    if throughput < 1:
        return f"{throughput * 60:.1f}/min"
    
    if throughput < 60:
        return f"{throughput:.1f}/s"
    
    per_minute = throughput / 60
    if per_minute < 60:
        return f"{per_minute:.1f}/min"
    
    per_hour = per_minute / 60
    return f"{per_hour:.1f}/h"



