"""
Main client class for interacting with SAB API.
"""

import asyncio
from typing import Optional, Dict, Any, List, Union
from contextlib import asynccontextmanager

from aiohttp import ClientSession, ClientError, ClientTimeout
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .config import SABConfig
from .exceptions import SABError, SABNetworkError, SABTimeoutError
from .tracing import Tracer, Span
from .services import JobService, ScheduleService, AdminService
from .models import (
    JobSubmissionRequest,
    JobResponse,
    ScheduleRequest,
    ScheduleResponse,
    ClusterStats,
    QueueStats,
    DLQItem,
    ApiKeyRequest,
    ApiKeyInfo,
    JobHealth,
)


class SabClient:
    """
    Main client class for interacting with SAB API.
    Provides methods for job submission, scheduling, and administration.
    """

    def __init__(self, config: SABConfig):
        """
        Initialize the client with configuration.
        
        Args:
            config: Client configuration
        """
        self.config = config
        self._session: Optional[ClientSession] = None
        self.tracer = Tracer(config)
        
        # Services will be initialized when session is created
        self._job_service: Optional[JobService] = None
        self._schedule_service: Optional[ScheduleService] = None
        self._admin_service: Optional[AdminService] = None

    @classmethod
    def builder(cls) -> "ClientBuilder":
        """
        Create a new builder for SabClient.
        
        Returns:
            ClientBuilder instance
        """
        return ClientBuilder()

    async def __aenter__(self) -> "SabClient":
        """Async context manager entry."""
        await self._ensure_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_session(self) -> None:
        """Ensure HTTP session is created."""
        if self._session is None or self._session.closed:
            timeout = ClientTimeout(total=self.config.timeout / 1000)
            self._session = ClientSession(
                timeout=timeout,
                headers={
                    "X-API-Key": self.config.api_key,
                    "X-Tenant-ID": self.config.tenant_id,
                    "Content-Type": "application/json",
                    "User-Agent": f"sab-python-sdk/2.0.0"
                }
            )
            
            # Initialize services
            self._job_service = JobService(self._session, self.config, self.tracer)
            self._schedule_service = ScheduleService(self._session, self.config, self.tracer)
            self._admin_service = AdminService(self._session, self.config, self.tracer)

    async def close(self) -> None:
        """Close the HTTP session and cleanup resources."""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None
            self._job_service = None
            self._schedule_service = None
            self._admin_service = None

    @property
    def _job(self) -> JobService:
        """Get job service, ensuring session exists."""
        if self._job_service is None:
            raise SABError("Client not initialized. Use async context manager or call _ensure_session().")
        return self._job_service

    @property
    def _schedule(self) -> ScheduleService:
        """Get schedule service, ensuring session exists."""
        if self._schedule_service is None:
            raise SABError("Client not initialized. Use async context manager or call _ensure_session().")
        return self._schedule_service

    @property
    def _admin(self) -> AdminService:
        """Get admin service, ensuring session exists."""
        if self._admin_service is None:
            raise SABError("Client not initialized. Use async context manager or call _ensure_session().")
        return self._admin_service

    # Job Operations

    async def submit_job(self, request: JobSubmissionRequest) -> JobResponse:
        """
        Submit a new job for execution.
        
        Args:
            request: Job submission request
            
        Returns:
            Job response
            
        Raises:
            SABError: If submission fails
        """
        await self._ensure_session()
        return await self._job.submit_job(request)

    async def get_job(self, job_id: str) -> Optional[JobResponse]:
        """
        Retrieve a job by its ID.
        
        Args:
            job_id: Job ID
            
        Returns:
            Job response if found, None otherwise
            
        Raises:
            SABError: If retrieval fails
        """
        await self._ensure_session()
        return await self._job.get_job(job_id)

    async def list_jobs(self) -> List[JobResponse]:
        """
        List jobs for the current tenant.
        
        Returns:
            List of job responses
            
        Raises:
            SABError: If listing fails
        """
        await self._ensure_session()
        return await self._job.list_jobs()

    async def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job.
        
        Args:
            job_id: Job ID to cancel
            
        Returns:
            True if cancellation was successful
            
        Raises:
            SABError: If cancellation fails
        """
        await self._ensure_session()
        return await self._job.cancel_job(job_id)

    async def get_job_health(self) -> JobHealth:
        """
        Get job health information.
        
        Returns:
            Job health information
            
        Raises:
            SABError: If retrieval fails
        """
        await self._ensure_session()
        return await self._job.get_job_health()

    async def get_job_types(self) -> List[str]:
        """
        Get available job types.
        
        Returns:
            List of available job types
            
        Raises:
            SABError: If retrieval fails
        """
        await self._ensure_session()
        return await self._job.get_job_types()

    async def wait_for_job(
        self,
        job_id: str,
        timeout: float = 300.0,
        poll_interval: float = 1.0,
        stop_on_status: Optional[List[str]] = None
    ) -> JobResponse:
        """
        Wait for a job to complete (polling).
        
        Args:
            job_id: Job ID to wait for
            timeout: Maximum time to wait in seconds
            poll_interval: Time between polls in seconds
            stop_on_status: List of statuses to stop on
            
        Returns:
            Final job response
            
        Raises:
            SABError: If waiting fails or times out
        """
        await self._ensure_session()
        return await self._job.wait_for_job(job_id, timeout, poll_interval, stop_on_status)

    async def submit_jobs_batch(self, requests: List[JobSubmissionRequest]) -> List[JobResponse]:
        """
        Submit multiple jobs in batch.
        
        Args:
            requests: List of job submission requests
            
        Returns:
            List of successfully submitted job responses
            
        Raises:
            SABError: If batch submission fails
        """
        await self._ensure_session()
        return await self._job.submit_jobs_batch(requests)

    # Schedule Operations

    async def create_schedule(self, request: ScheduleRequest) -> ScheduleResponse:
        """
        Create a new schedule.
        
        Args:
            request: Schedule creation request
            
        Returns:
            Created schedule response
            
        Raises:
            SABError: If creation fails
        """
        await self._ensure_session()
        return await self._schedule.create_schedule(request)

    async def list_schedules(self) -> List[ScheduleResponse]:
        """
        List schedules for the current tenant.
        
        Returns:
            List of schedule responses
            
        Raises:
            SABError: If listing fails
        """
        await self._ensure_session()
        return await self._schedule.list_schedules()

    async def cancel_schedule(self, schedule_id: str) -> bool:
        """
        Cancel a schedule.
        
        Args:
            schedule_id: Schedule ID to cancel
            
        Returns:
            True if cancellation was successful
            
        Raises:
            SABError: If cancellation fails
        """
        await self._ensure_session()
        return await self._schedule.cancel_schedule(schedule_id)

    async def get_schedule(self, schedule_id: str) -> Optional[ScheduleResponse]:
        """
        Get a schedule by its ID.
        
        Args:
            schedule_id: Schedule ID
            
        Returns:
            Schedule response if found, None otherwise
            
        Raises:
            SABError: If retrieval fails
        """
        await self._ensure_session()
        return await self._schedule.get_schedule(schedule_id)

    async def update_schedule(
        self,
        schedule_id: str,
        updates: Dict[str, Any]
    ) -> ScheduleResponse:
        """
        Update a schedule (partial update).
        
        Args:
            schedule_id: Schedule ID
            updates: Partial updates to apply
            
        Returns:
            Updated schedule response
            
        Raises:
            SABError: If update fails
        """
        await self._ensure_session()
        return await self._schedule.update_schedule(schedule_id, updates)

    async def pause_schedule(self, schedule_id: str) -> bool:
        """
        Pause a schedule.
        
        Args:
            schedule_id: Schedule ID to pause
            
        Returns:
            True if pause was successful
            
        Raises:
            SABError: If pause fails
        """
        await self._ensure_session()
        return await self._schedule.pause_schedule(schedule_id)

    async def resume_schedule(self, schedule_id: str) -> bool:
        """
        Resume a schedule.
        
        Args:
            schedule_id: Schedule ID to resume
            
        Returns:
            True if resume was successful
            
        Raises:
            SABError: If resume fails
        """
        await self._ensure_session()
        return await self._schedule.resume_schedule(schedule_id)

    # Admin Operations

    async def get_cluster_stats(self) -> ClusterStats:
        """
        Get cluster statistics.
        
        Returns:
            Cluster statistics
            
        Raises:
            SABError: If retrieval fails
        """
        await self._ensure_session()
        return await self._admin.get_cluster_stats()

    async def get_queue_stats(self) -> QueueStats:
        """
        Get queue statistics for the current tenant.
        
        Returns:
            Queue statistics
            
        Raises:
            SABError: If retrieval fails
        """
        await self._ensure_session()
        return await self._admin.get_queue_stats()

    async def list_dlq(self) -> List[DLQItem]:
        """
        List dead letter queue items.
        
        Returns:
            List of DLQ items
            
        Raises:
            SABError: If listing fails
        """
        await self._ensure_session()
        return await self._admin.list_dlq()

    async def retry_dlq_job(self, job_id: str) -> bool:
        """
        Retry a job from the dead letter queue.
        
        Args:
            job_id: Job ID to retry
            
        Returns:
            True if retry was successful
            
        Raises:
            SABError: If retry fails
        """
        await self._ensure_session()
        return await self._admin.retry_dlq_job(job_id)

    async def create_api_key(self, request: ApiKeyRequest) -> ApiKeyInfo:
        """
        Create a new API key.
        
        Args:
            request: API key creation request
            
        Returns:
            Created API key information
            
        Raises:
            SABError: If creation fails
        """
        await self._ensure_session()
        return await self._admin.create_api_key(request)

    async def list_api_keys(self) -> List[ApiKeyInfo]:
        """
        List API keys.
        
        Returns:
            List of API key information
            
        Raises:
            SABError: If listing fails
        """
        await self._ensure_session()
        return await self._admin.list_api_keys()

    async def delete_api_key(self, key_id: str) -> bool:
        """
        Delete an API key.
        
        Args:
            key_id: Key ID to delete
            
        Returns:
            True if deletion was successful
            
        Raises:
            SABError: If deletion fails
        """
        await self._ensure_session()
        return await self._admin.delete_api_key(key_id)

    async def clear_queues(self) -> bool:
        """
        Clear all queues.
        
        Returns:
            True if clearing was successful
            
        Raises:
            SABError: If clearing fails
        """
        await self._ensure_session()
        return await self._admin.clear_queues()

    async def retry_dlq_jobs_batch(self, job_ids: List[str]) -> Dict[str, Any]:
        """
        Retry multiple DLQ jobs in batch.
        
        Args:
            job_ids: List of job IDs to retry
            
        Returns:
            Dictionary with successful and failed retry results
            
        Raises:
            SABError: If batch retry fails
        """
        await self._ensure_session()
        return await self._admin.retry_dlq_jobs_batch(job_ids)


class ClientBuilder:
    """
    Builder class for SabClient.
    """

    def __init__(self):
        self._config: Dict[str, Any] = {}

    def base_url(self, url: str) -> "ClientBuilder":
        """
        Set the base URL for the SAB API.
        
        Args:
            url: Base URL
            
        Returns:
            Builder instance
        """
        self._config["base_url"] = url
        return self

    def api_key(self, key: str) -> "ClientBuilder":
        """
        Set the API key for authentication.
        
        Args:
            key: API key
            
        Returns:
            Builder instance
        """
        self._config["api_key"] = key
        return self

    def tenant_id(self, tenant_id: str) -> "ClientBuilder":
        """
        Set the tenant ID.
        
        Args:
            tenant_id: Tenant ID
            
        Returns:
            Builder instance
        """
        self._config["tenant_id"] = tenant_id
        return self

    def timeout(self, timeout_ms: int) -> "ClientBuilder":
        """
        Set the timeout for HTTP requests.
        
        Args:
            timeout_ms: Timeout in milliseconds
            
        Returns:
            Builder instance
        """
        self._config["timeout"] = timeout_ms
        return self

    def retry(self, max_attempts: int, backoff_ms: int) -> "ClientBuilder":
        """
        Set the retry configuration.
        
        Args:
            max_attempts: Maximum retry attempts
            backoff_ms: Backoff duration in milliseconds
            
        Returns:
            Builder instance
        """
        self._config["max_retries"] = max_attempts
        self._config["retry_backoff"] = backoff_ms
        return self

    def config(self, **kwargs) -> "ClientBuilder":
        """
        Set configuration parameters.
        
        Args:
            **kwargs: Configuration parameters
            
        Returns:
            Builder instance
        """
        self._config.update(kwargs)
        return self

    def build(self) -> SabClient:
        """
        Build the SabClient instance.
        
        Returns:
            Configured SabClient
            
        Raises:
            SABError: If required configuration is missing
        """
        # Set defaults
        final_config = {
            "base_url": "http://localhost:8080",
            "timeout": 30000,
            "max_retries": 3,
            "retry_backoff": 1000,
            "enable_tracing": True,
            "service_name": "sab-python-sdk",
            "service_version": "2.0.0",
        }
        final_config.update(self._config)

        # Validate required fields
        if not final_config.get("api_key"):
            raise SABError("API key is required", "MISSING_API_KEY")
        if not final_config.get("tenant_id"):
            raise SABError("Tenant ID is required", "MISSING_TENANT_ID")

        return SabClient(SABConfig(**final_config))
