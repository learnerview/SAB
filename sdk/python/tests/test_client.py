"""
Tests for SAB client.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import aiohttp
from aioresponses import aioresponses

from sab import SabClient, SABError
from sab.config import SABConfig
from sab.models import (
    JobSubmissionRequest,
    JobResponse,
    JobPriority,
    JobStatus,
    ScheduleRequest,
    ScheduleResponse,
    ClusterStats,
    QueueStats,
    DLQItem,
    ApiKeyRequest,
    ApiKeyInfo,
)


@pytest.fixture
def config():
    """Test configuration."""
    return SABConfig(
        base_url="http://localhost:8080",
        api_key="test-api-key",
        tenant_id="test-tenant",
        timeout=5000,
        max_retries=2,
        retry_backoff=100,
    )


@pytest.fixture
async def client(config):
    """Test client."""
    async with SabClient(config) as client:
        yield client


@pytest.fixture
def mock_session():
    """Mock HTTP session."""
    session = AsyncMock()
    return session


class TestSabClient:
    """Test cases for SabClient."""

    def test_builder_pattern(self):
        """Test builder pattern."""
        client = SabClient.builder() \
            .base_url("http://localhost:8080") \
            .api_key("test-key") \
            .tenant_id("test-tenant") \
            .timeout(30000) \
            .retry(3, 1000) \
            .build()
        
        assert client.config.base_url == "http://localhost:8080"
        assert client.config.api_key == "test-key"
        assert client.config.tenant_id == "test-tenant"
        assert client.config.timeout == 30000
        assert client.config.max_retries == 3
        assert client.config.retry_backoff == 1000

    def test_builder_missing_api_key(self):
        """Test builder with missing API key."""
        with pytest.raises(SABError, match="API key is required"):
            SabClient.builder() \
                .base_url("http://localhost:8080") \
                .tenant_id("test-tenant") \
                .build()

    def test_builder_missing_tenant_id(self):
        """Test builder with missing tenant ID."""
        with pytest.raises(SABError, match="Tenant ID is required"):
            SabClient.builder() \
                .base_url("http://localhost:8080") \
                .api_key("test-key") \
                .build()

    @pytest.mark.asyncio
    async def test_context_manager(self, config):
        """Test async context manager."""
        async with SabClient(config) as client:
            assert client.config == config
            assert client._session is not None

    @pytest.mark.asyncio
    async def test_submit_job_success(self, client):
        """Test successful job submission."""
        request = JobSubmissionRequest(
            job_type="webhook",
            priority=JobPriority.NORMAL,
            payload={"message": "Hello World"},
        )
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 201
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "message": "Job submitted successfully",
            "data": {
                "jobId": "job-123",
                "jobType": "webhook",
                "priority": "NORMAL",
                "status": "QUEUED"
            }
        })
        
        client._session.post = AsyncMock(return_value=mock_response)
        
        job = await client.submit_job(request)
        
        assert job.job_id == "job-123"
        assert job.job_type == "webhook"
        assert job.status == JobStatus.QUEUED

    @pytest.mark.asyncio
    async def test_submit_job_error(self, client):
        """Test job submission error."""
        request = JobSubmissionRequest(
            job_type="webhook",
            priority=JobPriority.NORMAL,
        )
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 400
        mock_response.json = AsyncMock(return_value={
            "success": False,
            "message": "Invalid job type",
            "errorCode": "VALIDATION_ERROR"
        })
        mock_response.content_type = "application/json"
        
        client._session.post = AsyncMock(return_value=mock_response)
        
        with pytest.raises(SABError, match="Invalid job type"):
            await client.submit_job(request)

    @pytest.mark.asyncio
    async def test_get_job_success(self, client):
        """Test successful job retrieval."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "data": {
                "jobId": "job-123",
                "jobType": "webhook",
                "priority": "NORMAL",
                "status": "RUNNING"
            }
        })
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        job = await client.get_job("job-123")
        
        assert job is not None
        assert job.job_id == "job-123"
        assert job.status == JobStatus.RUNNING

    @pytest.mark.asyncio
    async def test_get_job_not_found(self, client):
        """Test job not found."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 404
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        job = await client.get_job("non-existent")
        assert job is None

    @pytest.mark.asyncio
    async def test_list_jobs_success(self, client):
        """Test successful job listing."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "data": [
                {
                    "jobId": "job-123",
                    "jobType": "webhook",
                    "priority": "NORMAL",
                    "status": "QUEUED"
                },
                {
                    "jobId": "job-456",
                    "jobType": "webhook",
                    "priority": "HIGH",
                    "status": "RUNNING"
                }
            ]
        })
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        jobs = await client.list_jobs()
        
        assert len(jobs) == 2
        assert jobs[0].job_id == "job-123"
        assert jobs[1].job_id == "job-456"

    @pytest.mark.asyncio
    async def test_cancel_job_success(self, client):
        """Test successful job cancellation."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "message": "Job cancelled successfully",
            "data": True
        })
        
        client._session.delete = AsyncMock(return_value=mock_response)
        
        result = await client.cancel_job("job-123")
        assert result is True

    @pytest.mark.asyncio
    async def test_create_schedule_success(self, client):
        """Test successful schedule creation."""
        request = ScheduleRequest(
            cron="0 0 * * *",
            job_type="webhook",
            priority=JobPriority.NORMAL,
        )
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 201
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "message": "Schedule created successfully",
            "data": {
                "id": "schedule-123",
                "cron": "0 0 * * *",
                "jobType": "webhook",
                "priority": "NORMAL",
                "active": True
            }
        })
        
        client._session.post = AsyncMock(return_value=mock_response)
        
        schedule = await client.create_schedule(request)
        
        assert schedule.id == "schedule-123"
        assert schedule.cron == "0 0 * * *"
        assert schedule.active is True

    @pytest.mark.asyncio
    async def test_get_cluster_stats_success(self, client):
        """Test successful cluster stats retrieval."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "data": {
                "totalJobs": 100,
                "runningJobs": 10,
                "queuedJobs": 20,
                "successfulJobs": 60,
                "failedJobs": 8,
                "dlqJobs": 2,
                "activeWorkers": 5,
                "activeSchedules": 15
            }
        })
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        stats = await client.get_cluster_stats()
        
        assert stats.total_jobs == 100
        assert stats.running_jobs == 10
        assert stats.queued_jobs == 20

    @pytest.mark.asyncio
    async def test_get_queue_stats_success(self, client):
        """Test successful queue stats retrieval."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "data": {
                "queued": 20,
                "running": 10,
                "success": 60,
                "failed": 8,
                "dlq": 2,
                "throughput": 5.5,
                "avgExecutionTimeMs": 1500.0,
                "avgWaitTimeMs": 300.0
            }
        })
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        stats = await client.get_queue_stats()
        
        assert stats.queued == 20
        assert stats.running == 10
        assert stats.throughput == 5.5

    @pytest.mark.asyncio
    async def test_list_dlq_success(self, client):
        """Test successful DLQ listing."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "data": [
                {
                    "jobId": "job-123",
                    "jobType": "webhook",
                    "priority": "NORMAL",
                    "status": "DLQ",
                    "errorMessage": "Connection timeout",
                    "attemptCount": 3,
                    "maxAttempts": 3
                }
            ]
        })
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        dlq_items = await client.list_dlq()
        
        assert len(dlq_items) == 1
        assert dlq_items[0].job_id == "job-123"
        assert dlq_items[0].status == JobStatus.DLQ

    @pytest.mark.asyncio
    async def test_create_api_key_success(self, client):
        """Test successful API key creation."""
        request = ApiKeyRequest(
            label="Test Key",
            producer="test-tenant",
            is_admin=False,
        )
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 201
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "message": "API key created successfully",
            "data": {
                "id": "key-123",
                "label": "Test Key",
                "producer": "test-tenant",
                "apiKey": "sk-test-123456",
                "isAdmin": False,
                "active": True
            }
        })
        
        client._session.post = AsyncMock(return_value=mock_response)
        
        api_key = await client.create_api_key(request)
        
        assert api_key.id == "key-123"
        assert api_key.api_key == "sk-test-123456"
        assert api_key.is_admin is False

    @pytest.mark.asyncio
    async def test_clear_queues_success(self, client):
        """Test successful queue clearing."""
# Mock the HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "message": "Queues cleared successfully"
        })
        
        client._session.delete = AsyncMock(return_value=mock_response)
        
        result = await client.clear_queues()
        assert result is True

    @pytest.mark.asyncio
    async def test_wait_for_job_success(self, client):
        """Test successful job waiting."""
# Mock the job responses
        running_response = MagicMock()
        running_response.status = 200
        running_response.content_type = "application/json"
        running_response.json = AsyncMock(return_value={
            "success": True,
            "data": {
                "jobId": "job-123",
                "jobType": "webhook",
                "priority": "NORMAL",
                "status": "RUNNING"
            }
        })
        
        success_response = MagicMock()
        success_response.status = 200
        success_response.content_type = "application/json"
        success_response.json = AsyncMock(return_value={
            "success": True,
            "data": {
                "jobId": "job-123",
                "jobType": "webhook",
                "priority": "NORMAL",
                "status": "SUCCESS"
            }
        })
# Mock get_job to return running then success
        client._session.get = AsyncMock(side_effect=[running_response, success_response])
        
        job = await client.wait_for_job("job-123", timeout=1.0, poll_interval=0.1)
        
        assert job.status == JobStatus.SUCCESS

    @pytest.mark.asyncio
    async def test_wait_for_job_timeout(self, client):
        """Test job waiting timeout."""
# Mock the job response (always running)
        running_response = MagicMock()
        running_response.status = 200
        running_response.content_type = "application/json"
        running_response.json = AsyncMock(return_value={
            "success": True,
            "data": {
                "jobId": "job-123",
                "jobType": "webhook",
                "priority": "NORMAL",
                "status": "RUNNING"
            }
        })
        
        client._session.get = AsyncMock(return_value=running_response)
        
        with pytest.raises(SABError, match="Job wait timeout"):
            await client.wait_for_job("job-123", timeout=0.2, poll_interval=0.1)

    @pytest.mark.asyncio
    async def test_submit_jobs_batch_success(self, client):
        """Test successful batch job submission."""
        requests = [
            JobSubmissionRequest(job_type="webhook", priority=JobPriority.NORMAL, execution={"type": "HTTP", "endpoint": "https://example.com"}),
            JobSubmissionRequest(job_type="webhook", priority=JobPriority.HIGH, execution={"type": "HTTP", "endpoint": "https://example.com"}),
        ]
# Mock the HTTP responses
        mock_response1 = MagicMock()
        mock_response1.status = 201
        mock_response1.content_type = "application/json"
        mock_response1.json = AsyncMock(return_value={
            "success": True,
            "data": {"jobId": "job-123", "jobType": "webhook", "priority": "NORMAL", "status": "QUEUED"}
        })
        
        mock_response2 = MagicMock()
        mock_response2.status = 201
        mock_response2.content_type = "application/json"
        mock_response2.json = AsyncMock(return_value={
            "success": True,
            "data": {"jobId": "job-456", "jobType": "webhook", "priority": "HIGH", "status": "QUEUED"}
        })
        
        client._session.post = AsyncMock(side_effect=[mock_response1, mock_response2])
        
        jobs = await client.submit_jobs_batch(requests)
        
        assert len(jobs) == 2
        assert jobs[0].job_id == "job-123"
        assert jobs[1].job_id == "job-456"

    @pytest.mark.asyncio
    async def test_retry_dlq_jobs_batch_success(self, client):
        """Test successful batch DLQ retry."""
        job_ids = ["job-123", "job-456"]
# Mock the HTTP responses
        mock_response1 = AsyncMock()
        mock_response1.status = 200
        mock_response1.content_type = "application/json"
        mock_response1.json = AsyncMock(return_value={"success": True})
        
        mock_response2 = AsyncMock()
        mock_response2.status = 200
        mock_response2.content_type = "application/json"
        mock_response2.json = AsyncMock(return_value={"success": True})
        
        client._session.post = AsyncMock(side_effect=[mock_response1, mock_response2])
        
        result = await client.retry_dlq_jobs_batch(job_ids)
        
        assert len(result["successful"]) == 2
        assert result["successful"] == job_ids
        assert len(result["failed"]) == 0



