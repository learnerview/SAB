"""
Admin service for SAB SDK.
"""

import asyncio
from typing import List, Optional, Dict, Any
from aiohttp import ClientSession

from ..config import SABConfig
from ..tracing import Tracer, Span
from ..exceptions import SABError, error_from_status
from ..models import (
    ClusterStats,
    QueueStats,
    DLQItem,
    ApiKeyRequest,
    ApiKeyInfo,
    ApiResponse,
)


class AdminService:
    """Service for handling admin-related operations."""

    def __init__(self, session: ClientSession, config: SABConfig, tracer: Tracer):
        """
        Initialize admin service.
        
        Args:
            session: HTTP session
            config: Client configuration
            tracer: Tracer instance
        """
        self.session = session
        self.config = config
        self.tracer = tracer
        self.base_url = config.base_url.rstrip("/")

    async def _request(self, method: str, url: str, **kwargs):
        """Make HTTP request using aiohttp session."""
        method_func = getattr(self.session, method.lower())
        return await method_func(url, **kwargs)

    async def get_cluster_stats(self) -> ClusterStats:
        """
        Get cluster statistics.
        
        Returns:
            Cluster statistics
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.admin.cluster.stats")

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/stats"
                
                response = await self._request("get", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[ClusterStats](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to get cluster stats",
                            api_response.error_code,
                            response.status
                        )

                    stats = api_response.data
                    span.set_attribute("cluster.jobs.total", stats.total_jobs or 0)
                    span.set_attribute("cluster.jobs.running", stats.running_jobs or 0)
                    return stats
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get cluster stats: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_queue_stats(self) -> QueueStats:
        """
        Get queue statistics for the current tenant.
        
        Returns:
            Queue statistics
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.admin.queue.stats")

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/metrics"
                
                response = await self._request("get", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[QueueStats](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to get queue stats",
                            api_response.error_code,
                            response.status
                        )

                    stats = api_response.data
                    span.set_attribute("queue.jobs.queued", stats.queued or 0)
                    span.set_attribute("queue.jobs.running", stats.running or 0)
                    return stats
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get queue stats: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def list_dlq(self) -> List[DLQItem]:
        """
        List dead letter queue items.
        
        Returns:
            List of DLQ items
            
        Raises:
            SABError: If listing fails
        """
        span = self.tracer.start_span("sab.admin.dlq.list")

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/dlq"
                
                response = await self._request("get", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[List[DLQItem]](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to list DLQ",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("dlq.items.count", len(api_response.data))
                    return api_response.data
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to list DLQ: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.admin.dlq.retry", {"job.id": job_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/dlq/{job_id}/retry"
                
                response = await self._request("post", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[None](**data)

                    if not api_response.success:
                        raise SABError(
                            api_response.message or "Failed to retry DLQ job",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("job.retried", True)
                    return True
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to retry DLQ job: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.admin.keys.create", {"key.label": request.label})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/keys"
                payload = request.model_dump(exclude_none=True, by_alias=True)
                
                response = await self._request("post", url, json=payload)
                if response.status == 201:
                    data = await response.json()
                    api_response = ApiResponse[ApiKeyInfo](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to create API key",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("key.id", api_response.data.id)
                    return api_response.data
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to create API key: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def list_api_keys(self) -> List[ApiKeyInfo]:
        """
        List API keys.
        
        Returns:
            List of API key information
            
        Raises:
            SABError: If listing fails
        """
        span = self.tracer.start_span("sab.admin.keys.list")

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/keys"
                
                response = await self._request("get", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[List[ApiKeyInfo]](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to list API keys",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("keys.count", len(api_response.data))
                    return api_response.data
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to list API keys: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.admin.keys.delete", {"key.id": key_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/keys/{key_id}"
                
                response = await self._request("delete", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[None](**data)

                    if not api_response.success:
                        raise SABError(
                            api_response.message or "Failed to delete API key",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("key.deleted", True)
                    return True
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to delete API key: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def clear_queues(self) -> bool:
        """
        Clear all queues.
        
        Returns:
            True if clearing was successful
            
        Raises:
            SABError: If clearing fails
        """
        span = self.tracer.start_span("sab.admin.queues.clear")

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/queues"
                
                response = await self._request("delete", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[None](**data)

                    if not api_response.success:
                        raise SABError(
                            api_response.message or "Failed to clear queues",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("queues.cleared", True)
                    return True
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to clear queues: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.admin.dlq.batch.retry", {
            "dlq.batch.size": len(job_ids)
        })

        try:
            with span.make_current():
                tasks = [self.retry_dlq_job(job_id) for job_id in job_ids]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                successful: List[str] = []
                failed: List[Dict[str, Any]] = []
                
                for i, result in enumerate(results):
                    job_id = job_ids[i]
                    if isinstance(result, SABError):
                        failed.append({"jobId": job_id, "error": result})
                    elif isinstance(result, Exception):
                        failed.append({"jobId": job_id, "error": SABError(f"Unexpected error: {str(result)}", "UNKNOWN_ERROR", 0, result)})
                    else:
                        successful.append(job_id)
                
                span.set_attribute("dlq.batch.successful", len(successful))
                span.set_attribute("dlq.batch.failed", len(failed))
                
                return {"successful": successful, "failed": failed}
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to retry DLQ jobs batch: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_dlq_items_by_type(self) -> Dict[str, List[DLQItem]]:
        """
        Get DLQ items by error type.
        
        Returns:
            Dictionary categorized by error type
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.admin.dlq.byType")

        try:
            with span.make_current():
                all_items = await self.list_dlq()
                categorized = {}
                
                for item in all_items:
                    error = item.error_message or "Unknown"
                    category = self._get_error_category(error)
                    
                    if category not in categorized:
                        categorized[category] = []
                    categorized[category].append(item)
                
                span.set_attribute("dlq.categories.count", len(categorized))
                return categorized
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get DLQ items by type: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_recent_dlq_items(self) -> List[DLQItem]:
        """
        Get recent DLQ items (failed within last hour).
        
        Returns:
            List of recent DLQ items
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.admin.dlq.recent")

        try:
            with span.make_current():
                all_items = await self.list_dlq()
                one_hour_ago = (asyncio.get_event_loop().time() - 3600) * 1000
                
                recent_items = []
                for item in all_items:
                    if not item.failed_at:
                        continue
                    
                    failed_at = item.failed_at.timestamp() * 1000
                    if failed_at >= one_hour_ago:
                        recent_items.append(item)
                
                span.set_attribute("dlq.recent.count", len(recent_items))
                return recent_items
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get recent DLQ items: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_old_dlq_items(self) -> List[DLQItem]:
        """
        Get old DLQ items (failed more than 24 hours ago).
        
        Returns:
            List of old DLQ items
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.admin.dlq.old")

        try:
            with span.make_current():
                all_items = await self.list_dlq()
                one_day_ago = (asyncio.get_event_loop().time() - 86400) * 1000
                
                old_items = []
                for item in all_items:
                    if not item.failed_at:
                        continue
                    
                    failed_at = item.failed_at.timestamp() * 1000
                    if failed_at < one_day_ago:
                        old_items.append(item)
                
                span.set_attribute("dlq.old.count", len(old_items))
                return old_items
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get old DLQ items: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def update_api_key(
        self,
        key_id: str,
        updates: Dict[str, Any]
    ) -> ApiKeyInfo:
        """
        Update an API key.
        
        Args:
            key_id: Key ID
            updates: Partial updates to apply
            
        Returns:
            Updated API key information
            
        Raises:
            SABError: If update fails
        """
        span = self.tracer.start_span("sab.admin.keys.update", {"key.id": key_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/keys/{key_id}"
                
                response = await self._request("patch", url, json=updates)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[ApiKeyInfo](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to update API key",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("key.updated", True)
                    return api_response.data
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to update API key: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def rotate_api_key(self, key_id: str) -> ApiKeyInfo:
        """
        Rotate an API key (creates new key and deactivates old one).
        
        Args:
            key_id: Key ID to rotate
            
        Returns:
            New API key information
            
        Raises:
            SABError: If rotation fails
        """
        span = self.tracer.start_span("sab.admin.keys.rotate", {"key.id": key_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/admin/keys/{key_id}/rotate"
                
                response = await self._request("post", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[ApiKeyInfo](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to rotate API key",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("key.rotated", True)
                    return api_response.data
                else:
                    error_data = await response.json() if response.content_type == "application/json" else {}
                    raise error_from_status(
                        response.status,
                        error_data.get("message", f"HTTP {response.status}"),
                        SABError(error_data.get("message", f"HTTP {response.status}"))
                    )
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to rotate API key: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    def _get_error_category(self, error_message: str) -> str:
        """
        Categorize error by type.
        
        Args:
            error_message: Error message to categorize
            
        Returns:
            Error category
        """
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




