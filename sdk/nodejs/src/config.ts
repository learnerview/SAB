//Configuration class for SAB client.

export interface SABConfig {
  //Base URL for the SAB API.

  baseUrl: string;
  //API key for authentication.

  apiKey: string;
  //Tenant ID for multi-tenant isolation.

  tenantId: string;
  //Timeout for HTTP requests in milliseconds.

  timeout: number;
  //Maximum number of retry attempts.

  maxRetries: number;
  //Backoff duration between retries in milliseconds.

  retryBackoff: number;
  //Whether to enable OpenTelemetry tracing.

  enableTracing: boolean;
  //OpenTelemetry service name.

  serviceName: string;
  //OpenTelemetry service version.

  serviceVersion: string;
  //OpenTelemetry collector endpoint.

  otelEndpoint?: string;
  //Whether to enable circuit breaker.

  enableCircuitBreaker: boolean;
  //Circuit breaker failure rate threshold (percentage).

  circuitBreakerFailureRateThreshold: number;
  //Circuit breaker wait duration in open state (milliseconds).

  circuitBreakerWaitDuration: number;
  //Whether to enable rate limiting.

  enableRateLimiter: boolean;
  //Rate limit - requests per second.

  rateLimitRps: number;
  //Whether to enable bulkhead.

  enableBulkhead: boolean;
  //Bulkhead max concurrent requests.

  bulkheadMaxConcurrentCalls: number;
  //Bulkhead max wait duration (milliseconds).

  bulkheadMaxWaitDuration: number;
}
//Default configuration values.

export const DEFAULT_CONFIG: Partial<SABConfig> = {
  baseUrl: 'http://localhost:8080',
  timeout: 30000,
  maxRetries: 3,
  retryBackoff: 1000,
  enableTracing: true,
  serviceName: 'sab-nodejs-sdk',
  serviceVersion: '2.0.0',
  enableCircuitBreaker: true,
  circuitBreakerFailureRateThreshold: 50.0,
  circuitBreakerWaitDuration: 30000,
  enableRateLimiter: true,
  rateLimitRps: 100,
  enableBulkhead: true,
  bulkheadMaxConcurrentCalls: 100,
  bulkheadMaxWaitDuration: 10000,
};
//Creates a configuration object with defaults applied.

export function createConfig(config: Partial<SABConfig>): SABConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  } as SABConfig;
}
