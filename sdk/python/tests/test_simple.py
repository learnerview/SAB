"""
Simple test cases for Python SDK - Basic functionality test.
"""

import pytest
from sab import SabClient, SABError
from sab.config import SABConfig


def test_builder_pattern():
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


def test_builder_missing_api_key():
    """Test builder with missing API key."""
    with pytest.raises(SABError, match="API key is required"):
        SabClient.builder() \
            .base_url("http://localhost:8080") \
            .tenant_id("test-tenant") \
            .build()


def test_builder_missing_tenant_id():
    """Test builder with missing tenant ID."""
    with pytest.raises(SABError, match="Tenant ID is required"):
        SabClient.builder() \
            .base_url("http://localhost:8080") \
            .api_key("test-key") \
            .build()


@pytest.mark.asyncio
async def test_context_manager():
    """Test async context manager."""
    config = SABConfig(
        base_url="http://localhost:8080",
        api_key="test-api-key",
        tenant_id="test-tenant",
        timeout=5000,
        max_retries=2,
        retry_backoff=100,
    )
    
    async with SabClient(config) as client:
        assert client.config == config
        assert client._session is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
