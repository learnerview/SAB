"use strict";
//Configuration class for SAB client.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfig = exports.DEFAULT_CONFIG = void 0;
//Default configuration values.
exports.DEFAULT_CONFIG = {
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
function createConfig(config) {
    return {
        ...exports.DEFAULT_CONFIG,
        ...config,
    };
}
exports.createConfig = createConfig;
//# sourceMappingURL=config.js.map