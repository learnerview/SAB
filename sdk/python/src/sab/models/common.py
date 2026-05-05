"""
Common models and enums used across the SDK.
"""

from typing import Any, Dict, List, Optional, TypeVar, Generic
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")


class JobPriority(str, Enum):
    """Job priority levels."""
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"


class JobStatus(str, Enum):
    """Job status values."""
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    RETRY_SCHEDULED = "RETRY_SCHEDULED"
    DLQ = "DLQ"
    CANCELLED = "CANCELLED"


class ExecutionType(str, Enum):
    """Execution type values."""
    HTTP = "HTTP"
    WEBHOOK = "WEBHOOK"


class ApiResponse(BaseModel, Generic[T]):
    """Generic API response wrapper."""
    success: bool
    message: Optional[str] = None
    data: Optional[T] = None
    error_code: Optional[str] = None
    timestamp: Optional[int] = None


class ListResponse(BaseModel, Generic[T]):
    """Generic list response wrapper."""
    success: bool
    message: Optional[str] = None
    data: Optional[List[T]] = None
    error_code: Optional[str] = None
    timestamp: Optional[int] = None


class ExecutionPolicy(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Execution policy configuration."""
    type: ExecutionType
    endpoint: str
    timeout_seconds: Optional[int] = None
    callback_url: Optional[str] = Field(None, alias="callbackUrl")
    headers: Optional[Dict[str, str]] = None
    retry_policy: Optional["RetryPolicy"] = Field(None, alias="retryPolicy")


class RetryPolicy(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Retry policy configuration."""
    max_attempts: Optional[int] = Field(None, alias="maxAttempts")
    initial_backoff_ms: Optional[int] = Field(None, alias="initialBackoffMs")
    max_backoff_ms: Optional[int] = Field(None, alias="maxBackoffMs")
    multiplier: Optional[float] = None
    use_jitter: Optional[bool] = Field(True, alias="useJitter")


class MemoryInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Memory usage information."""
    total_bytes: Optional[int] = Field(None, alias="totalBytes")
    used_bytes: Optional[int] = Field(None, alias="usedBytes")
    free_bytes: Optional[int] = Field(None, alias="freeBytes")
    usage_percentage: Optional[float] = Field(None, alias="usagePercentage")


class CpuInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """CPU usage information."""
    usage_percentage: Optional[float] = Field(None, alias="usagePercentage")
    available_processors: Optional[int] = Field(None, alias="availableProcessors")
    system_load_average: Optional[float] = Field(None, alias="systemLoadAverage")


class LeaseInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    """Lease information for jobs."""
    owner: Optional[str] = None
    token: Optional[str] = None
    expires_at: Optional[str] = Field(None, alias="expiresAt")
    visible_at: Optional[str] = Field(None, alias="visibleAt")
# Helper functions for model operations
def is_response_success(response: ApiResponse) -> bool:
    """Check if response is successful."""
    return response.success


def has_response_data(response: ApiResponse) -> bool:
    """Check if response has data."""
    return response.data is not None


def get_response_data(response: ApiResponse[T]) -> Optional[T]:
    """Extract data from response."""
    return response.data


def get_response_error(response: ApiResponse) -> Dict[str, Any]:
    """Extract error information from response."""
    return {
        "message": response.message,
        "error_code": response.error_code,
    }


def create_success_response(data: T, message: Optional[str] = None) -> ApiResponse[T]:
    """Create a successful response."""
    return ApiResponse[T](
        success=True,
        message=message,
        data=data,
        timestamp=int(__import__("time").time() * 1000)
    )


def create_error_response(
    message: str,
    error_code: Optional[str] = None,
    data: Optional[Any] = None
) -> ApiResponse:
    """Create an error response."""
    return ApiResponse(
        success=False,
        message=message,
        error_code=error_code,
        data=data,
        timestamp=int(__import__("time").time() * 1000)
    )



