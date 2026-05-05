"""
Admin-related models for SAB SDK.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from .common import (
    JobPriority,
    JobStatus,
    MemoryInfo,
    CpuInfo,
    LeaseInfo,
)


class ClusterStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Cluster statistics information."""
    total_jobs: Optional[int] = Field(None, alias="totalJobs")
    running_jobs: Optional[int] = Field(None, alias="runningJobs")
    queued_jobs: Optional[int] = Field(None, alias="queuedJobs")
    successful_jobs: Optional[int] = Field(None, alias="successfulJobs")
    failed_jobs: Optional[int] = Field(None, alias="failedJobs")
    dlq_jobs: Optional[int] = Field(None, alias="dlqJobs")
    active_workers: Optional[int] = Field(None, alias="activeWorkers")
    active_schedules: Optional[int] = Field(None, alias="activeSchedules")
    uptime_ms: Optional[int] = Field(None, alias="uptimeMs")
    memory: Optional[MemoryInfo] = None
    cpu: Optional[CpuInfo] = None


class QueueStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Queue statistics information."""
    high_priority_queued: Optional[int] = Field(None, alias="highPriorityQueued")
    normal_priority_queued: Optional[int] = Field(None, alias="normalPriorityQueued")
    low_priority_queued: Optional[int] = Field(None, alias="lowPriorityQueued")
    queued: Optional[int] = None
    running: Optional[int] = None
    success: Optional[int] = None
    failed: Optional[int] = None
    dlq: Optional[int] = None
    throughput: Optional[float] = None
    avg_execution_time_ms: Optional[float] = Field(None, alias="avgExecutionTimeMs")
    avg_wait_time_ms: Optional[float] = Field(None, alias="avgWaitTimeMs")
    queue_age_ms: Optional[int] = Field(None, alias="queueAgeMs")


class DLQItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Dead Letter Queue item information."""
    job_id: str = Field(..., alias="jobId")
    job_type: str = Field(..., alias="jobType")
    priority: JobPriority
    status: JobStatus
    payload: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = Field(None, alias="errorMessage")
    attempt_count: Optional[int] = Field(None, alias="attemptCount")
    max_attempts: Optional[int] = Field(None, alias="maxAttempts")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    failed_at: Optional[datetime] = Field(None, alias="failedAt")
    tenant_id: Optional[str] = Field(None, alias="tenantId")


class ApiKeyRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Request object for creating an API key."""
    label: str
    producer: str
    is_admin: Optional[bool] = Field(False, alias="isAdmin")


class ApiKeyInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """API key information."""
    id: str
    label: str
    producer: str
    api_key: Optional[str] = Field(None, alias="apiKey")
    is_admin: Optional[bool] = Field(False, alias="isAdmin")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    last_used_at: Optional[datetime] = Field(None, alias="lastUsedAt")
    active: Optional[bool] = True
# Helper functions for cluster stats
def get_job_success_rate(stats: ClusterStats) -> Optional[float]:
    """Calculate job success rate."""
    successful = stats.successful_jobs or 0
    failed = stats.failed_jobs or 0
    total = successful + failed
    
    if total == 0:
        return None
    
    return (successful / total) * 100


def get_job_failure_rate(stats: ClusterStats) -> Optional[float]:
    """Calculate job failure rate."""
    successful = stats.successful_jobs or 0
    failed = stats.failed_jobs or 0
    total = successful + failed
    
    if total == 0:
        return None
    
    return (failed / total) * 100


def get_system_health(stats: ClusterStats) -> str:
    """Get system health status."""
    success_rate = get_job_success_rate(stats)
    memory_usage = stats.memory.usage_percentage if stats.memory else 0
    cpu_usage = stats.cpu.usage_percentage if stats.cpu else 0
# Critical conditions
    if memory_usage > 90 or cpu_usage > 90 or (success_rate is not None and success_rate < 80):
        return "CRITICAL"
# Warning conditions
    if memory_usage > 70 or cpu_usage > 70 or (success_rate is not None and success_rate < 90):
        return "WARNING"
    
    return "HEALTHY"


def format_uptime(uptime_ms: int) -> str:
    """Format uptime."""
    seconds = uptime_ms // 1000
    minutes = seconds // 60
    hours = minutes // 60
    days = hours // 24
    
    if days > 0:
        return f"{days}d {hours % 24}h {minutes % 60}m"
    
    if hours > 0:
        return f"{hours}h {minutes % 60}m"
    
    if minutes > 0:
        return f"{minutes}m {seconds % 60}s"
    
    return f"{seconds}s"
# Helper functions for queue stats
def get_total_queued(stats: QueueStats) -> int:
    """Calculate total queued jobs."""
    return (
        (stats.high_priority_queued or 0) +
        (stats.normal_priority_queued or 0) +
        (stats.low_priority_queued or 0)
    )


def get_queue_success_rate(stats: QueueStats) -> Optional[float]:
    """Calculate queue success rate."""
    success = stats.success or 0
    failed = stats.failed or 0
    total = success + failed
    
    if total == 0:
        return None
    
    return (success / total) * 100


def get_queue_failure_rate(stats: QueueStats) -> Optional[float]:
    """Calculate queue failure rate."""
    success = stats.success or 0
    failed = stats.failed or 0
    total = success + failed
    
    if total == 0:
        return None
    
    return (failed / total) * 100


def get_queue_health(stats: QueueStats) -> str:
    """Get queue health status."""
    total_queued = get_total_queued(stats)
    running = stats.running or 0
    success_rate = get_queue_success_rate(stats)
    queue_age = stats.queue_age_ms or 0
# Idle state
    if total_queued == 0 and running == 0:
        return "IDLE"
# Critical conditions
    if queue_age > 300000 or total_queued > 1000 or (success_rate is not None and success_rate < 80):
        return "CRITICAL"
# Warning conditions
    if queue_age > 120000 or total_queued > 500 or (success_rate is not None and success_rate < 90):
        return "WARNING"
    
    return "HEALTHY"


def format_queue_age(queue_age_ms: int) -> str:
    """Format queue age."""
    seconds = queue_age_ms // 1000
    minutes = seconds // 60
    hours = minutes // 60
    
    if hours > 0:
        return f"{hours}h {minutes % 60}m"
    
    if minutes > 0:
        return f"{minutes}m {seconds % 60}s"
    
    return f"{seconds}s"


def get_priority_distribution(stats: QueueStats) -> Dict[str, Any]:
    """Get priority distribution."""
    high = stats.high_priority_queued or 0
    normal = stats.normal_priority_queued or 0
    low = stats.low_priority_queued or 0
    total = high + normal + low
    
    return {
        "high": high,
        "normal": normal,
        "low": low,
        "percentages": {
            "high": (high / total) * 100 if total > 0 else 0,
            "normal": (normal / total) * 100 if total > 0 else 0,
            "low": (low / total) * 100 if total > 0 else 0
        }
    }
# Helper functions for DLQ items
def has_exhausted_retries(item: DLQItem) -> bool:
    """Check if a DLQ item has exhausted retries."""
    attempt_count = item.attempt_count or 0
    max_attempts = item.max_attempts or 0
    return attempt_count >= max_attempts


def get_time_since_failure(item: DLQItem) -> Optional[float]:
    """Get time since failure in milliseconds."""
    if not item.failed_at:
        return None
    
    failed_at = item.failed_at.timestamp() * 1000
    now = datetime.now().timestamp() * 1000
    return now - failed_at


def format_failure_time(item: DLQItem) -> str:
    """Format failure time."""
    time_since = get_time_since_failure(item)
    if time_since is None:
        return "Unknown"
    
    minutes = int(time_since // (1000 * 60))
    hours = minutes // 60
    days = hours // 24
    
    if days > 0:
        return f"{days}d {hours % 24}h ago"
    
    if hours > 0:
        return f"{hours}h {minutes % 60}m ago"
    
    if minutes > 0:
        return f"{minutes}m ago"
    
    return "Just now"


def get_retry_summary(item: DLQItem) -> str:
    """Get retry attempt summary."""
    attempt_count = item.attempt_count or 0
    max_attempts = item.max_attempts or 0
    return f"{attempt_count}/{max_attempts}"


def is_recent_failure(item: DLQItem) -> bool:
    """Check if DLQ item is recent (failed within last hour)."""
    time_since = get_time_since_failure(item)
    return time_since is not None and time_since < (60 * 60 * 1000)


def is_old_failure(item: DLQItem) -> bool:
    """Check if DLQ item is old (failed more than 24 hours ago)."""
    time_since = get_time_since_failure(item)
    return time_since is not None and time_since > (24 * 60 * 60 * 1000)


def categorize_by_error(items: List[DLQItem]) -> Dict[str, List[DLQItem]]:
    """Categorize DLQ items by error type."""
    categories = {}
    
    for item in items:
        error = item.error_message or "Unknown"
        category = get_error_category(error)
        
        if category not in categories:
            categories[category] = []
        categories[category].append(item)
    
    return categories


def get_error_category(error_message: str) -> str:
    """Categorize error by type."""
    message = error_message.lower()
    
    if "timeout" in message:
        return "Timeout"
    
    if "connection" in message or "network" in message:
        return "Network"
    
    if "401" in message or "unauthorized" in message:
        return "Authentication"
    
    if "403" in message or "forbidden" in message:
        return "Authorization"
    
    if "404" in message or "not found" in message:
        return "Not Found"
    
    if "429" in message or "rate limit" in message:
        return "Rate Limit"
    
    if "500" in message or "server error" in message:
        return "Server Error"
    
    if "validation" in message or "invalid" in message:
        return "Validation"
    
    return "Other"
# Helper functions for API keys
def is_admin_key(key_info: ApiKeyInfo) -> bool:
    """Check if API key is admin."""
    return key_info.is_admin is True


def is_key_active(key_info: ApiKeyInfo) -> bool:
    """Check if API key is active."""
    return key_info.active is not False


def get_key_age(key_info: ApiKeyInfo) -> Optional[float]:
    """Get key age in milliseconds."""
    if not key_info.created_at:
        return None
    
    created_at = key_info.created_at.timestamp() * 1000
    now = datetime.now().timestamp() * 1000
    return now - created_at


def get_time_since_last_use(key_info: ApiKeyInfo) -> Optional[float]:
    """Get time since last use in milliseconds."""
    if not key_info.last_used_at:
        return None
    
    last_used_at = key_info.last_used_at.timestamp() * 1000
    now = datetime.now().timestamp() * 1000
    return now - last_used_at


def format_key_age(key_info: ApiKeyInfo) -> str:
    """Format key age."""
    age = get_key_age(key_info)
    if age is None:
        return "Unknown"
    
    minutes = int(age // (1000 * 60))
    hours = minutes // 60
    days = hours // 24
    
    if days > 0:
        return f"{days}d {hours % 24}h ago"
    
    if hours > 0:
        return f"{hours}h {minutes % 60}m ago"
    
    if minutes > 0:
        return f"{minutes}m ago"
    
    return "Just now"


def format_last_used(key_info: ApiKeyInfo) -> str:
    """Format last used time."""
    time_since = get_time_since_last_use(key_info)
    if time_since is None:
        return "Never"
    
    minutes = int(time_since // (1000 * 60))
    hours = minutes // 60
    days = hours // 24
    
    if days > 0:
        return f"{days}d {hours % 24}h ago"
    
    if hours > 0:
        return f"{hours}h {minutes % 60}m ago"
    
    if minutes > 0:
        return f"{minutes}m ago"
    
    return "Just now"


def is_recently_used(key_info: ApiKeyInfo) -> bool:
    """Check if key is recently used (within last hour)."""
    time_since = get_time_since_last_use(key_info)
    return time_since is not None and time_since < (60 * 60 * 1000)


def is_stale_key(key_info: ApiKeyInfo) -> bool:
    """Check if key is stale (not used in last 30 days)."""
    time_since = get_time_since_last_use(key_info)
    return time_since is not None and time_since > (30 * 24 * 60 * 60 * 1000)


def get_key_status(key_info: ApiKeyInfo) -> Dict[str, Any]:
    """Get key status summary."""
    return {
        "active": is_key_active(key_info),
        "admin": is_admin_key(key_info),
        "recently_used": is_recently_used(key_info),
        "stale": is_stale_key(key_info),
        "age": format_key_age(key_info),
        "last_used": format_last_used(key_info)
    }



