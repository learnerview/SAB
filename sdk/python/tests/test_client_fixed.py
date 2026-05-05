"""
Test cases for SabClient - Fixed version.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

from sab import SabClient, SABError
from sab.models import JobSubmissionRequest, JobPriority, JobStatus
from sab.config import SABConfig


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
            execution={"type": "HTTP", "endpoint": "https://example.com"}
        )
        
        # Mock HTTP response
        mock_response = AsyncMock()
        mock_response.status = 201
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
        
        # Mock the session post method
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
            payload={"message": "Hello World"},
            execution={"type": "HTTP", "endpoint": "https://example.com"}
        )
        
        # Mock HTTP error response
        mock_response = AsyncMock()
        mock_response.status = 400
        mock_response.json = AsyncMock(return_value={
            "success": False,
            "message": "Bad request",
            "errorCode": "BAD_REQUEST"
        })
        
        client._session.post = AsyncMock(return_value=mock_response)
        
        with pytest.raises(SABError, match="HTTP 400"):
            await client.submit_job(request)

    @pytest.mark.asyncio
    async def test_get_job_success(self, client):
        """Test successful job retrieval."""
        # Mock HTTP response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "data": {
                "jobId": "job-123",
                "jobType": "webhook",
                "status": "RUNNING"
            }
        })
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        job = await client.get_job("job-123")
        
        assert job is not None
        assert job.job_id == "job-123"
        assert job.job_type == "webhook"

    @pytest.mark.asyncio
    async def test_get_job_not_found(self, client):
        """Test job not found."""
        # Mock HTTP response
        mock_response = AsyncMock()
        mock_response.status = 404
        
        client._session.get = AsyncMock(return_value=mock_response)
        
        job = await client.get_job("non-existent")
        
        assert job is None

    @pytest.mark.asyncio
    async def test_list_jobs_success(self, client):
        """Test successful job listing."""
        # Mock HTTP response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "success": True,
            "data": [
                {"jobId": "job-123", "jobType": "webhook", "status": "QUEUED"},
                {"jobId": "job-456", "jobType": "webhook", "status": "RUNNING"}
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
        # Mock HTTP response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.content_type = "application/json"
        mock_response.json = AsyncMock(return_value={"success": True, "data": True})
        
        client._session.delete = AsyncMock(return_value=mock_response)
        
        result = await client.cancel_job("job-123")
        
        assert result is True

    @pytest.mark.asyncio
    async def test_wait_for_job_success(self, client):
        """Test successful job waiting."""
        # Mock running response then completed response
        running_response = AsyncMock()
        running_response.status = 200
        running_response.json = AsyncMock(return_value={
            "success": True,
            "data": {"jobId": "job-123", "status": "RUNNING"}
        })
        
        completed_response = AsyncMock()
        completed_response.status = 200
        completed_response.json = AsyncMock(return_value={
            "success": True,
            "data": {"jobId": "job-123", "status": "SUCCESS"}
        })
        
        client._session.get = AsyncMock(side_effect=[running_response, completed_response])
        
        job = await client.wait_for_job("job-123", timeout=1.0, poll_interval=0.1)
        
        assert job.status == JobStatus.SUCCESS

    @pytest.mark.asyncio
    async def test_wait_for_job_timeout(self, client):
        """Test job waiting timeout."""
        # Mock running response (never completes)
        running_response = AsyncMock()
        running_response.status = 200
        running_response.json = AsyncMock(return_value={
            "success": True,
            "data": {"jobId": "job-123", "status": "RUNNING"}
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
        
        # Mock HTTP responses
        mock_response1 = AsyncMock()
        mock_response1.status = 201
        mock_response1.json = AsyncMock(return_value={
            "success": True,
            "data": {"jobId": "job-123", "jobType": "webhook", "priority": "NORMAL", "status": "QUEUED"}
        })
        
        mock_response2 = AsyncMock()
        mock_response2.status = 201
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
        
        # Mock HTTP responses
        mock_response1 = AsyncMock()
        mock_response1.status = 200
        mock_response1.json = AsyncMock(return_value={"success": True})
        
        mock_response2 = AsyncMock()
        mock_response2.status = 200
        mock_response2.json = AsyncMock(return_value={"success": True})
        
        client._session.post = AsyncMock(side_effect=[mock_response1, mock_response2])
        
        result = await client.retry_dlq_jobs_batch(job_ids)
        
        assert len(result["successful"]) == 2
        assert result["successful"] == job_ids
        assert len(result["failed"]) == 0
