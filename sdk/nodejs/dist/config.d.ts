export interface SABConfig {
    baseUrl: string;
    apiKey: string;
    tenantId: string;
    timeout: number;
    maxRetries: number;
    retryBackoff: number;
    enableTracing: boolean;
    serviceName: string;
    serviceVersion: string;
    otelEndpoint?: string;
    enableCircuitBreaker: boolean;
    circuitBreakerFailureRateThreshold: number;
    circuitBreakerWaitDuration: number;
    enableRateLimiter: boolean;
    rateLimitRps: number;
    enableBulkhead: boolean;
    bulkheadMaxConcurrentCalls: number;
    bulkheadMaxWaitDuration: number;
}
export declare const DEFAULT_CONFIG: Partial<SABConfig>;
export declare function createConfig(config: Partial<SABConfig>): SABConfig;
//# sourceMappingURL=config.d.ts.map