"""
Configuration class for SAB client.
"""

from typing import Optional
from dataclasses import dataclass, field


@dataclass
class SABConfig:
    """
    Configuration class for SAB client.
    """
# Required fields
    base_url: str
    api_key: str
    tenant_id: str
# Optional fields with defaults
    timeout: int = 30000  # milliseconds
    max_retries: int = 3
    retry_backoff: int = 1000  # milliseconds
    enable_tracing: bool = True
    service_name: str = "sab-python-sdk"
    service_version: str = "2.0.0"
    otel_endpoint: Optional[str] = None
# Resilience settings
    enable_circuit_breaker: bool = True
    circuit_breaker_failure_rate_threshold: float = 50.0
    circuit_breaker_wait_duration: int = 30000  # milliseconds
# Rate limiting
    enable_rate_limiter: bool = True
    rate_limit_rps: int = 100
# Bulkhead pattern
    enable_bulkhead: bool = True
    bulkhead_max_concurrent_calls: int = 100
    bulkhead_max_wait_duration: int = 10000  # milliseconds
# HTTP settings
    connection_pool_size: int = 10
    connection_pool_maxsize: int = 100
    keepalive_timeout: int = 30  # seconds
    disable_ssl_verify: bool = False
# Retry settings
    retry_jitter: bool = True
    retry_max_delay: int = 30000  # milliseconds
# Logging
    enable_logging: bool = True
    log_level: str = "INFO"

    def __post_init__(self) -> None:
        """Validate configuration after initialization."""
        if not self.base_url:
            raise ValueError("Base URL is required")
        # Only validate API key and tenant if this is not the default config with empty values
        if self.api_key or self.tenant_id:
            if not self.api_key:
                raise ValueError("API key is required")
            if not self.tenant_id:
                raise ValueError("Tenant ID is required")
        if self.timeout <= 0:
            raise ValueError("Timeout must be positive")
        if self.max_retries < 0:
            raise ValueError("Max retries must be non-negative")
        if self.retry_backoff <= 0:
            raise ValueError("Retry backoff must be positive")

    @property
    def timeout_seconds(self) -> float:
        """Get timeout in seconds."""
        return self.timeout / 1000.0

    @property
    def retry_backoff_seconds(self) -> float:
        """Get retry backoff in seconds."""
        return self.retry_backoff / 1000.0

    @property
    def circuit_breaker_wait_duration_seconds(self) -> float:
        """Get circuit breaker wait duration in seconds."""
        return self.circuit_breaker_wait_duration / 1000.0

    @property
    def bulkhead_max_wait_duration_seconds(self) -> float:
        """Get bulkhead max wait duration in seconds."""
        return self.bulkhead_max_wait_duration / 1000.0

    @property
    def retry_max_delay_seconds(self) -> float:
        """Get retry max delay in seconds."""
        return self.retry_max_delay / 1000.0

    def copy(self, **updates) -> "SABConfig":
        """
        Create a copy of the configuration with updates.
        
        Args:
            **updates: Configuration updates
            
        Returns:
            Updated configuration copy
        """
# Get current values as dict
        current_values = {
            field.name: getattr(self, field.name)
            for field in self.__dataclass_fields__.values()
        }
# Apply updates
        current_values.update(updates)
        
        return SABConfig(**current_values)

    def to_dict(self) -> dict:
        """
        Convert configuration to dictionary.
        
        Returns:
            Configuration as dictionary
        """
        return {
            field.name: getattr(self, field.name)
            for field in self.__dataclass_fields__.values()
        }

    @classmethod
    def from_dict(cls, config_dict: dict) -> "SABConfig":
        """
        Create configuration from dictionary.
        
        Args:
            config_dict: Configuration dictionary
            
        Returns:
            Configuration instance
        """
        return cls(**config_dict)

    @classmethod
    def from_env(cls) -> "SABConfig":
        """
        Create configuration from environment variables.
        
        Returns:
            Configuration instance
            
        Raises:
            ValueError: If required environment variables are missing or invalid
        """
        import os
        
        # Get and validate required environment variables
        api_key = os.getenv("SAB_API_KEY", "")
        tenant_id = os.getenv("SAB_TENANT_ID", "")
        
        if not api_key:
            raise ValueError("SAB_API_KEY environment variable is required")
        if not tenant_id:
            raise ValueError("SAB_TENANT_ID environment variable is required")
        
        # Validate optional numeric environment variables
        timeout_str = os.getenv("SAB_TIMEOUT", "30000")
        try:
            timeout = int(timeout_str)
            if timeout <= 0:
                raise ValueError("SAB_TIMEOUT must be positive")
        except ValueError:
            raise ValueError(f"SAB_TIMEOUT must be a positive integer, got: {timeout_str}")
        
        max_retries_str = os.getenv("SAB_MAX_RETRIES", "3")
        try:
            max_retries = int(max_retries_str)
            if max_retries < 0:
                raise ValueError("SAB_MAX_RETRIES must be non-negative")
        except ValueError:
            raise ValueError(f"SAB_MAX_RETRIES must be a non-negative integer, got: {max_retries_str}")
        
        return cls(
            base_url=os.getenv("SAB_BASE_URL", "http://localhost:8080"),
            api_key=api_key,
            tenant_id=tenant_id,
            timeout=timeout,
            max_retries=max_retries,
            retry_backoff=int(os.getenv("SAB_RETRY_BACKOFF", "1000")),
            enable_tracing=os.getenv("SAB_ENABLE_TRACING", "true").lower() == "true",
            service_name=os.getenv("SAB_SERVICE_NAME", "sab-python-sdk"),
            service_version=os.getenv("SAB_SERVICE_VERSION", "2.0.0"),
            otel_endpoint=os.getenv("SAB_OTEL_ENDPOINT"),
            enable_circuit_breaker=os.getenv("SAB_ENABLE_CIRCUIT_BREAKER", "true").lower() == "true",
            circuit_breaker_failure_rate_threshold=float(
                os.getenv("SAB_CIRCUIT_BREAKER_FAILURE_RATE", "50.0")
            ),
            circuit_breaker_wait_duration=int(
                os.getenv("SAB_CIRCUIT_BREAKER_WAIT_DURATION", "30000")
            ),
            enable_rate_limiter=os.getenv("SAB_ENABLE_RATE_LIMITER", "true").lower() == "true",
            rate_limit_rps=int(os.getenv("SAB_RATE_LIMIT_RPS", "100")),
            enable_bulkhead=os.getenv("SAB_ENABLE_BULKHEAD", "true").lower() == "true",
            bulkhead_max_concurrent_calls=int(os.getenv("SAB_BULKHEAD_MAX_CONCURRENT", "100")),
            bulkhead_max_wait_duration=int(os.getenv("SAB_BULKHEAD_MAX_WAIT_DURATION", "10000")),
            connection_pool_size=int(os.getenv("SAB_CONNECTION_POOL_SIZE", "10")),
            connection_pool_maxsize=int(os.getenv("SAB_CONNECTION_POOL_MAXSIZE", "100")),
            keepalive_timeout=int(os.getenv("SAB_KEEPALIVE_TIMEOUT", "30")),
            disable_ssl_verify=os.getenv("SAB_DISABLE_SSL_VERIFY", "false").lower() == "true",
            retry_jitter=os.getenv("SAB_RETRY_JITTER", "true").lower() == "true",
            retry_max_delay=int(os.getenv("SAB_RETRY_MAX_DELAY", "30000")),
            enable_logging=os.getenv("SAB_ENABLE_LOGGING", "true").lower() == "true",
            log_level=os.getenv("SAB_LOG_LEVEL", "INFO"),
        )
# Default configuration values (without sensitive credentials)
DEFAULT_CONFIG = SABConfig(
    base_url="http://localhost:8080",
    api_key="",  # Must be provided by user
    tenant_id="",  # Must be provided by user
    timeout=30000,
    max_retries=3,
    retry_backoff=1000,
    enable_tracing=True,
    service_name="sab-python-sdk",
    service_version="2.0.0",
    enable_circuit_breaker=True,
    circuit_breaker_failure_rate_threshold=50.0,
    circuit_breaker_wait_duration=30000,
    enable_rate_limiter=True,
    rate_limit_rps=100,
    enable_bulkhead=True,
    bulkhead_max_concurrent_calls=100,
    bulkhead_max_wait_duration=10000,
    connection_pool_size=10,
    connection_pool_maxsize=100,
    keepalive_timeout=30,
    disable_ssl_verify=False,
    retry_jitter=True,
    retry_max_delay=30000,
    enable_logging=True,
    log_level="INFO",
)



