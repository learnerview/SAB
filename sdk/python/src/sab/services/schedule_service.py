"""
Schedule service for SAB SDK.
"""

import asyncio
from typing import List, Optional, Dict, Any
from aiohttp import ClientSession

from ..config import SABConfig
from ..tracing import Tracer, Span
from ..exceptions import SABError, error_from_status
from ..models import (
    ScheduleRequest,
    ScheduleResponse,
    ApiResponse,
    JobPriority,
)


class ScheduleService:
    """Service for handling schedule-related operations."""

    def __init__(self, session: ClientSession, config: SABConfig, tracer: Tracer):
        """
        Initialize schedule service.
        
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
        span = self.tracer.start_span("sab.schedule.create", {
            "schedule.cron": request.cron,
            "schedule.jobType": request.job_type,
            "schedule.priority": request.priority.value if request.priority else "NORMAL"
        })

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/schedules"
                payload = request.model_dump(exclude_none=True, by_alias=True)
                
                response = await self._request("post", url, json=payload)
                if response.status == 201:
                    data = await response.json()
                    api_response = ApiResponse[ScheduleResponse](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Schedule creation failed",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("schedule.id", api_response.data.id)
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
                raise SABError(f"Failed to create schedule: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def list_schedules(self) -> List[ScheduleResponse]:
        """
        List schedules for the current tenant.
        
        Returns:
            List of schedule responses
            
        Raises:
            SABError: If listing fails
        """
        span = self.tracer.start_span("sab.schedules.list")

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/schedules"
                
                response = await self._request("get", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[List[ScheduleResponse]](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to list schedules",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("schedules.count", len(api_response.data))
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
                raise SABError(f"Failed to list schedules: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.schedule.cancel", {"schedule.id": schedule_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/schedules/{schedule_id}"
                
                response = await self._request("delete", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[None](**data)

                    if not api_response.success:
                        raise SABError(
                            api_response.message or "Failed to cancel schedule",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("schedule.cancelled", True)
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
                raise SABError(f"Failed to cancel schedule: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.schedule.get", {"schedule.id": schedule_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/schedules/{schedule_id}"
                
                response = await self._request("get", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[ScheduleResponse](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to get schedule",
                            api_response.error_code,
                            response.status
                        )

                    return api_response.data
                elif response.status == 404:
                    return None
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
                raise SABError(f"Failed to get schedule: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.schedule.update", {"schedule.id": schedule_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/schedules/{schedule_id}"
                
                response = await self._request("patch", url, json=updates)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[ScheduleResponse](**data)

                    if not api_response.success or not api_response.data:
                        raise SABError(
                            api_response.message or "Failed to update schedule",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("schedule.updated", True)
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
                raise SABError(f"Failed to update schedule: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.schedule.pause", {"schedule.id": schedule_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/schedules/{schedule_id}/pause"
                
                response = await self._request("post", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[None](**data)

                    if not api_response.success:
                        raise SABError(
                            api_response.message or "Failed to pause schedule",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("schedule.paused", True)
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
                raise SABError(f"Failed to pause schedule: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

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
        span = self.tracer.start_span("sab.schedule.resume", {"schedule.id": schedule_id})

        try:
            with span.make_current():
                url = f"{self.base_url}/api/v1/schedules/{schedule_id}/resume"
                
                response = await self._request("post", url)
                if response.status == 200:
                    data = await response.json()
                    api_response = ApiResponse[None](**data)

                    if not api_response.success:
                        raise SABError(
                            api_response.message or "Failed to resume schedule",
                            api_response.error_code,
                            response.status
                        )

                    span.set_attribute("schedule.resumed", True)
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
                raise SABError(f"Failed to resume schedule: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_schedules_by_type(self, job_type: str) -> List[ScheduleResponse]:
        """
        Get schedules by job type.
        
        Args:
            job_type: Job type to filter by
            
        Returns:
            List of schedules with the specified job type
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.schedules.byType", {"schedule.jobType": job_type})

        try:
            with span.make_current():
                all_schedules = await self.list_schedules()
                filtered_schedules = [s for s in all_schedules if s.job_type == job_type]
                
                span.set_attribute("schedules.filtered.count", len(filtered_schedules))
                return filtered_schedules
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get schedules by type: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_schedules_by_priority(self, priority: JobPriority) -> List[ScheduleResponse]:
        """
        Get schedules by priority.
        
        Args:
            priority: Priority to filter by
            
        Returns:
            List of schedules with the specified priority
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.schedules.byPriority", {"schedule.priority": priority.value})

        try:
            with span.make_current():
                all_schedules = await self.list_schedules()
                filtered_schedules = [s for s in all_schedules if s.priority == priority]
                
                span.set_attribute("schedules.filtered.count", len(filtered_schedules))
                return filtered_schedules
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get schedules by priority: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_active_schedules(self) -> List[ScheduleResponse]:
        """
        Get active schedules only.
        
        Returns:
            List of active schedules
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.schedules.active")

        try:
            with span.make_current():
                all_schedules = await self.list_schedules()
                active_schedules = [s for s in all_schedules if s.active is not False]
                
                span.set_attribute("schedules.active.count", len(active_schedules))
                return active_schedules
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get active schedules: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def get_schedules_running_within(self, time_window_ms: float) -> List[ScheduleResponse]:
        """
        Get schedules that will run within a time window.
        
        Args:
            time_window_ms: Time window in milliseconds
            
        Returns:
            List of schedules that will run within the time window
            
        Raises:
            SABError: If retrieval fails
        """
        span = self.tracer.start_span("sab.schedules.runningWithin", {
            "schedule.timeWindow": time_window_ms
        })

        try:
            with span.make_current():
                all_schedules = await self.list_schedules()
                now = asyncio.get_event_loop().time() * 1000
                cutoff = now + time_window_ms
                
                upcoming_schedules = []
                for schedule in all_schedules:
                    if not schedule.next_run_at or schedule.active is False:
                        continue
                    
                    next_run_time = schedule.next_run_at.timestamp() * 1000
                    if now <= next_run_time <= cutoff:
                        upcoming_schedules.append(schedule)
                
                span.set_attribute("schedules.upcoming.count", len(upcoming_schedules))
                return upcoming_schedules
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to get schedules running within: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()

    async def create_schedules_batch(self, requests: List[ScheduleRequest]) -> List[ScheduleResponse]:
        """
        Create multiple schedules in batch.
        
        Args:
            requests: List of schedule creation requests
            
        Returns:
            List of successfully created schedule responses
            
        Raises:
            SABError: If batch creation fails
        """
        span = self.tracer.start_span("sab.schedules.batch.create", {
            "schedules.batch.size": len(requests)
        })

        try:
            with span.make_current():
                tasks = [self.create_schedule(request) for request in requests]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                schedules: List[ScheduleResponse] = []
                errors: List[SABError] = []
                
                for result in results:
                    if isinstance(result, SABError):
                        errors.append(result)
                    elif isinstance(result, Exception):
                        errors.append(SABError(f"Unexpected error: {str(result)}", "UNKNOWN_ERROR", 0, result))
                    else:
                        schedules.append(result)
                
                if errors:
                    span.set_attribute("schedules.batch.errors", len(errors))
# Log warnings but don't fail the entire batch
                    for error in errors:
                        print(f"Batch schedule creation warning: {error}")
                
                span.set_attribute("schedules.batch.successful", len(schedules))
                return schedules
        except Exception as e:
            if not isinstance(e, SABError):
                span.record_exception(e)
                raise SABError(f"Failed to create schedules batch: {str(e)}", "NETWORK_ERROR", 0, e)
            raise
        finally:
            span.end()


