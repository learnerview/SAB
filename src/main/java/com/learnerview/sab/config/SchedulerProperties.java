// Scheduler configuration properties for SAB job scheduling platform
// This configuration class defines all tunable parameters for the SAB
// system, including scheduling, rate limiting, retry behavior, worker settings,
// and queue management. Properties are loaded from application.yml/properties.
//
// Key configuration areas:
// - Scheduler polling intervals and queue prefixes
// - Rate limiting parameters for abuse prevention
// - Retry policies with exponential backoff and jitter
// - Worker thread pool and lease management
// - Queue depth limits and overflow protection
package com.learnerview.sab.config;

// Lombok annotations for boilerplate code generation
import lombok.Data;
// Spring Boot configuration properties binding
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// Spring component for configuration properties binding
// Binds properties with prefix 'sab' from configuration files
@Component
@ConfigurationProperties(prefix = "sab")
@Data
public class SchedulerProperties {

    // Scheduler configuration section
    private final Scheduler scheduler = new Scheduler();
    // Rate limiting configuration section
    private final RateLimit rateLimit = new RateLimit();
    // Retry policy configuration section
    private final Retry retry = new Retry();
    // Worker thread pool configuration section
    private final Worker worker = new Worker();
    // Queue management configuration section
    private final Queue queue = new Queue();

    // Scheduler-specific configuration
    @Data
    public static class Scheduler {
        // Polling interval in milliseconds for checking scheduled jobs
        private long pollingIntervalMs = 1000;
        // Redis queue key prefix for multi-tenant isolation
        private String queuePrefix = "sab:queue";
        // Priority weighting configuration for job scheduling
        private final Weights weights = new Weights();

        // Priority weight distribution for job scheduling
        // Higher weights get more processing time
        @Data
        public static class Weights {
            // Weight for HIGH priority jobs (percentage)
            private int high = 70;
            // Weight for NORMAL priority jobs (percentage)
            private int normal = 20;
            // Weight for LOW priority jobs (percentage)
            private int low = 10;
        }
    }

    // Rate limiting configuration for API protection
    @Data
    public static class RateLimit {
        // Maximum number of requests allowed per minute
        private int requestsPerMinute = 60;
        // Time window in seconds for rate limiting
        private int windowSeconds = 60;
    }

    // Retry policy configuration for failed jobs
    @Data
    public static class Retry {
        // Maximum number of retry attempts before giving up
        private int maxAttempts = 3;
        // Initial delay in seconds before first retry
        private int initialDelaySeconds = 5;
        // Multiplier for exponential backoff calculation
        private double backoffMultiplier = 2.0;
        // Maximum delay in seconds between retries
        private long maxDelaySeconds = 300;
        // Jitter percentage to prevent thundering herd
        private int jitterPercent = 20;
    }

    // Worker thread pool configuration
    @Data
    public static class Worker {
        // Lease timeout in seconds for job claims
        private int leaseTimeoutSeconds = 30;
        // Interval in milliseconds for promoting retry jobs
        private long retryPromoterIntervalMs = 1000;
        // Interval in milliseconds for lease reaper cleanup
        private long leaseReaperIntervalMs = 5000;
        // Number of worker threads in the thread pool
        private int threads = 4;
    }

    // Queue management configuration
    @Data
    public static class Queue {
        // Maximum queue depth before rejecting new jobs
        private long maxDepth = 10000;
    }
}
