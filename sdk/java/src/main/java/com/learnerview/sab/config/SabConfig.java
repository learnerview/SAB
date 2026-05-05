package com.learnerview.sab.config;

import lombok.Builder;
import lombok.Data;

import java.time.Duration;
// Configuration class for SAB client.
@Data
@Builder(toBuilder = true)
public class SabConfig {
// Base URL for the SAB API.
@Builder.Default
private String baseUrl = "http://localhost:8080";
// API key for authentication.
private String apiKey;
// Tenant ID for multi-tenant isolation.
private String tenantId;
// Timeout for HTTP requests.
@Builder.Default
private Duration timeout = Duration.ofSeconds(30);
// Maximum number of retry attempts.
@Builder.Default
private int maxRetries = 3;
// Backoff duration between retries.
@Builder.Default
private Duration retryBackoff = Duration.ofSeconds(1);
// Whether to enable OpenTelemetry tracing.
@Builder.Default
private boolean enableTracing = true;
// OpenTelemetry service name.
@Builder.Default
private String serviceName = "sab-java-sdk";
// OpenTelemetry service version.
@Builder.Default
private String serviceVersion = "2.0.0";
// OpenTelemetry collector endpoint.
private String otelEndpoint;
// Whether to enable circuit breaker.
@Builder.Default
private boolean enableCircuitBreaker = true;
// Circuit breaker failure rate threshold (percentage).
@Builder.Default
private float circuitBreakerFailureRateThreshold = 50.0f;
// Circuit breaker wait duration in open state.
@Builder.Default
private Duration circuitBreakerWaitDuration = Duration.ofSeconds(30);
// Whether to enable rate limiting.
@Builder.Default
private boolean enableRateLimiter = true;
// Rate limit - requests per second.
@Builder.Default
private int rateLimitRps = 100;
// Whether to enable bulkhead.
@Builder.Default
private boolean enableBulkhead = true;
// Bulkhead max concurrent requests.
@Builder.Default
private int bulkheadMaxConcurrentCalls = 100;
// Bulkhead max wait duration.
@Builder.Default
private Duration bulkheadMaxWaitDuration = Duration.ofSeconds(10);
}


