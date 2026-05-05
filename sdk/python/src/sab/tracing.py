"""
Tracing utilities for SAB SDK.
"""

import time
from typing import Any, Dict, Optional, ContextManager
from contextlib import contextmanager
from dataclasses import dataclass, field

from .config import SABConfig


@dataclass
class Span:
    """
    Span implementation for tracing.
    """

    name: str
    attributes: Dict[str, Any] = field(default_factory=dict)
    start_time: float = field(default_factory=time.time)
    end_time: Optional[float] = None
    error: Optional[Exception] = None

    def set_attribute(self, key: str, value: Any) -> None:
        """Set an attribute on the span."""
        self.attributes[key] = value

    def record_exception(self, error: Exception) -> None:
        """Record an exception on the span."""
        self.error = error
        self.set_attribute("error", True)
        self.set_attribute("error.message", str(error))
        if hasattr(error, "__traceback__"):
            self.set_attribute("error.stack", str(error.__traceback__))

    def end(self) -> None:
        """End the span."""
        if self.end_time is None:
            self.end_time = time.time()
            duration = self.end_time - self.start_time
            self.set_attribute("duration_ms", duration * 1000)

    def make_current(self) -> ContextManager["Span"]:
        """Make the span the active span in the current context."""
        return self._make_current_context()

    @contextmanager
    def _make_current_context(self):
        """Context manager for making span current."""
# In a real implementation, this would manage thread-local or async context
        try:
            yield self
        finally:
            pass

    def to_dict(self) -> Dict[str, Any]:
        """Convert span to dictionary for logging/export."""
        return {
            "name": self.name,
            "attributes": self.attributes,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_ms": (self.end_time - self.start_time) * 1000 if self.end_time else None,
            "error": str(self.error) if self.error else None,
        }


class NoOpSpan(Span):
    """No-op span implementation for when tracing is disabled."""

    def __init__(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        super().__init__(name, attributes or {})

    def set_attribute(self, key: str, value: Any) -> None:
        """No-op implementation."""
        pass

    def record_exception(self, error: Exception) -> None:
        """No-op implementation."""
        pass

    def end(self) -> None:
        """No-op implementation."""
        pass

    def make_current(self) -> ContextManager["Span"]:
        """No-op implementation."""
        return self._make_current_context()


class Tracer:
    """
    Simple tracing implementation for SAB SDK.
    """

    def __init__(self, config: SABConfig):
        """
        Initialize tracer with configuration.
        
        Args:
            config: Client configuration
        """
        self.config = config
        self.enabled = config.enable_tracing

    def start_span(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> Span:
        """
        Start a new span.
        
        Args:
            name: Span name
            attributes: Initial attributes
            
        Returns:
            Span instance
        """
        if not self.enabled:
            return NoOpSpan(name, attributes)

        span = Span(name, attributes or {})
# Add common attributes
        span.set_attribute("service.name", self.config.service_name)
        span.set_attribute("service.version", self.config.service_version)
        span.set_attribute("tenant.id", self.config.tenant_id)
        
        return span

    @contextmanager
    def span_context(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        """
        Context manager for automatic span lifecycle.
        
        Args:
            name: Span name
            attributes: Initial attributes
            
        Yields:
            Span instance
        """
        span = self.start_span(name, attributes)
        try:
            with span.make_current():
                yield span
        except Exception as e:
            span.record_exception(e)
            raise
        finally:
            span.end()

    def log_span(self, span: Span) -> None:
        """
        Log span information (for debugging).
        
        Args:
            span: Span to log
        """
        if not self.enabled:
            return

        span_data = span.to_dict()
        print(f"Span: {span_data}")  # In a real implementation, this would go to a collector
# Global tracer instance
_tracer: Optional[Tracer] = None


def get_tracer() -> Optional[Tracer]:
    """Get the global tracer instance."""
    return _tracer


def set_tracer(tracer: Tracer) -> None:
    """Set the global tracer instance."""
    global _tracer
    _tracer = tracer


def init_tracing(config: SABConfig) -> Tracer:
    """
    Initialize tracing with configuration.
    
    Args:
        config: Client configuration
        
    Returns:
        Tracer instance
    """
    tracer = Tracer(config)
    set_tracer(tracer)
    return tracer
# Decorators for automatic tracing
def traced(operation_name: Optional[str] = None):
    """
    Decorator for automatic function tracing.
    
    Args:
        operation_name: Custom operation name
        
    Returns:
        Decorator function
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            tracer = get_tracer()
            if not tracer:
                return func(*args, **kwargs)

            name = operation_name or f"{func.__module__}.{func.__name__}"
            with tracer.span_context(name) as span:
                try:
                    result = func(*args, **kwargs)
# Add result attributes if possible
                    if hasattr(result, "__dict__"):
                        if hasattr(result, "job_id"):
                            span.set_attribute("job.id", result.job_id)
                        if hasattr(result, "id"):
                            span.set_attribute("result.id", result.id)
                    
                    return result
                except Exception as e:
                    span.record_exception(e)
                    raise

        return wrapper
    return decorator
# Async decorator for tracing
def traced_async(operation_name: Optional[str] = None):
    """
    Decorator for automatic async function tracing.
    
    Args:
        operation_name: Custom operation name
        
    Returns:
        Decorator function
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            tracer = get_tracer()
            if not tracer:
                return await func(*args, **kwargs)

            name = operation_name or f"{func.__module__}.{func.__name__}"
            with tracer.span_context(name) as span:
                try:
                    result = await func(*args, **kwargs)
# Add result attributes if possible
                    if hasattr(result, "__dict__"):
                        if hasattr(result, "job_id"):
                            span.set_attribute("job.id", result.job_id)
                        if hasattr(result, "id"):
                            span.set_attribute("result.id", result.id)
                    
                    return result
                except Exception as e:
                    span.record_exception(e)
                    raise

        return wrapper
    return decorator
# Context manager for manual tracing
@contextmanager
def trace(operation_name: str, **attributes):
    """
    Context manager for manual tracing.
    
    Args:
        operation_name: Operation name
        **attributes: Initial attributes
        
    Yields:
        Span instance
    """
    tracer = get_tracer()
    if not tracer:
        yield NoOpSpan(operation_name, attributes)
    else:
        with tracer.span_context(operation_name, attributes) as span:
            yield span



