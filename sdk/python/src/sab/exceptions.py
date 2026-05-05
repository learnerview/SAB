"""
Exception classes for SAB SDK.
"""

from typing import Optional, Any


class SABError(Exception):
    """
    Base exception class for SAB SDK errors.
    """

    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        http_status: Optional[int] = None,
        cause: Optional[Exception] = None
    ) -> None:
        super().__init__(message)
        self.error_code = error_code
        self.http_status = http_status
        self.cause = cause

    @property
    def is_network(self) -> bool:
        """Check if this is a network error."""
        return self.error_code == "NETWORK_ERROR"

    @property
    def is_timeout(self) -> bool:
        """Check if this is a timeout error."""
        return self.error_code == "TIMEOUT_ERROR"

    @property
    def is_authentication(self) -> bool:
        """Check if this is an authentication error."""
        return self.error_code == "AUTHENTICATION_ERROR"

    @property
    def is_authorization(self) -> bool:
        """Check if this is an authorization error."""
        return self.error_code == "AUTHORIZATION_ERROR"

    @property
    def is_not_found(self) -> bool:
        """Check if this is a not found error."""
        return self.error_code == "NOT_FOUND"

    @property
    def is_validation(self) -> bool:
        """Check if this is a validation error."""
        return self.error_code == "VALIDATION_ERROR"

    @property
    def is_rate_limit(self) -> bool:
        """Check if this is a rate limit error."""
        return self.error_code == "RATE_LIMIT_ERROR"

    @property
    def is_server(self) -> bool:
        """Check if this is a server error."""
        return self.error_code == "SERVER_ERROR"

    @property
    def is_configuration(self) -> bool:
        """Check if this is a configuration error."""
        return self.error_code == "CONFIGURATION_ERROR"

    @property
    def is_retryable(self) -> bool:
        """Check if this error is retryable."""
        return (
            self.is_network
            or self.is_timeout
            or self.is_rate_limit
            or (self.is_server and self.http_status and self.http_status >= 500)
        )

    def __str__(self) -> str:
        result = f"{self.__class__.__name__}: {super().__str__()}"
        
        if self.error_code:
            result += f" [errorCode={self.error_code}]"
        
        if self.http_status:
            result += f" [httpStatus={self.http_status}]"
        
        if self.cause:
            result += f" [cause={self.cause}]"
        
        return result


class SABNetworkError(SABError):
    """Network-related errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "NETWORK_ERROR", 0, cause)


class SABTimeoutError(SABError):
    """Timeout-related errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "TIMEOUT_ERROR", 408, cause)


class SABAuthenticationError(SABError):
    """Authentication-related errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "AUTHENTICATION_ERROR", 401, cause)


class SABAuthorizationError(SABError):
    """Authorization-related errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "AUTHORIZATION_ERROR", 403, cause)


class SABNotFoundError(SABError):
    """Resource not found errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "NOT_FOUND", 404, cause)


class SABValidationError(SABError):
    """Validation-related errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "VALIDATION_ERROR", 400, cause)


class SABRateLimitError(SABError):
    """Rate limiting errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "RATE_LIMIT_ERROR", 429, cause)


class SABServerError(SABError):
    """Server-side errors."""

    def __init__(self, message: str, http_status: int = 500, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "SERVER_ERROR", http_status, cause)


class SABConfigurationError(SABError):
    """Configuration-related errors."""

    def __init__(self, message: str, cause: Optional[Exception] = None) -> None:
        super().__init__(message, "CONFIGURATION_ERROR", 0, cause)
# Helper functions for creating specific error types
def network_error(message: str, cause: Optional[Exception] = None) -> SABNetworkError:
    """Create a network error."""
    return SABNetworkError(message, cause)


def timeout_error(message: str, cause: Optional[Exception] = None) -> SABTimeoutError:
    """Create a timeout error."""
    return SABTimeoutError(message, cause)


def authentication_error(message: str, cause: Optional[Exception] = None) -> SABAuthenticationError:
    """Create an authentication error."""
    return SABAuthenticationError(message, cause)


def authorization_error(message: str, cause: Optional[Exception] = None) -> SABAuthorizationError:
    """Create an authorization error."""
    return SABAuthorizationError(message, cause)


def not_found_error(message: str, cause: Optional[Exception] = None) -> SABNotFoundError:
    """Create a not found error."""
    return SABNotFoundError(message, cause)


def validation_error(message: str, cause: Optional[Exception] = None) -> SABValidationError:
    """Create a validation error."""
    return SABValidationError(message, cause)


def rate_limit_error(message: str, cause: Optional[Exception] = None) -> SABRateLimitError:
    """Create a rate limit error."""
    return SABRateLimitError(message, cause)


def server_error(message: str, http_status: int = 500, cause: Optional[Exception] = None) -> SABServerError:
    """Create a server error."""
    return SABServerError(message, http_status, cause)


def configuration_error(message: str, cause: Optional[Exception] = None) -> SABConfigurationError:
    """Create a configuration error."""
    return SABConfigurationError(message, cause)
# Error mapping from HTTP status codes
def error_from_status(status: int, message: str, cause: Optional[Exception] = None) -> SABError:
    """
    Create appropriate error from HTTP status code.
    
    Args:
        status: HTTP status code
        message: Error message
        cause: Original exception
        
    Returns:
        Appropriate SABError subclass
    """
    # Normalize status to an int when possible (tests may supply AsyncMock or other objects)
    try:
        s = int(status)
    except Exception:
        return SABError(message, "HTTP_ERROR", None, cause)

    if s == 400:
        return validation_error(message, cause)
    elif s == 401:
        return authentication_error(message, cause)
    elif s == 403:
        return authorization_error(message, cause)
    elif s == 404:
        return not_found_error(message, cause)
    elif s == 429:
        return rate_limit_error(message, cause)
    elif s >= 500:
        return server_error(message, s, cause)
    else:
        return SABError(message, "HTTP_ERROR", s, cause)
# Error categorization
def categorize_error(error: Exception) -> str:
    """
    Categorize an error for logging and monitoring.
    
    Args:
        error: Exception to categorize
        
    Returns:
        Error category string
    """
    if isinstance(error, SABNetworkError):
        return "network"
    elif isinstance(error, SABTimeoutError):
        return "timeout"
    elif isinstance(error, SABAuthenticationError):
        return "authentication"
    elif isinstance(error, SABAuthorizationError):
        return "authorization"
    elif isinstance(error, SABNotFoundError):
        return "not_found"
    elif isinstance(error, SABValidationError):
        return "validation"
    elif isinstance(error, SABRateLimitError):
        return "rate_limit"
    elif isinstance(error, SABServerError):
        return "server"
    elif isinstance(error, SABConfigurationError):
        return "configuration"
    else:
        return "unknown"



