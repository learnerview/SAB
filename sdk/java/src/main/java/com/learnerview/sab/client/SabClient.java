package com.learnerview.sab.client;

import com.learnerview.sab.config.SabConfig;
import com.learnerview.sab.exception.SabException;
import com.learnerview.sab.model.*;
import com.learnerview.sab.service.JobService;
import com.learnerview.sab.service.ScheduleService;
import com.learnerview.sab.service.AdminService;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Main client class for interacting with SAB API.
 * Provides methods for job submission, scheduling, and administration.
 */
@Slf4j
public class SabClient {

    private final SabConfig config;
    private final WebClient webClient;
    private final Tracer tracer;
    private final JobService jobService;
    private final ScheduleService scheduleService;
    private final AdminService adminService;

    private SabClient(Builder builder) {
        this.config = builder.config;
        this.webClient = builder.webClient;
        this.tracer = builder.tracer;
        this.jobService = new JobService(webClient, config, tracer);
        this.scheduleService = new ScheduleService(webClient, config, tracer);
        this.adminService = new AdminService(webClient, config, tracer);
    }

    /**
     * Creates a new builder for SabClient.
     *
     * @return new Builder instance
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Submits a new job for execution.
     *
     * @param jobRequest the job submission request
     * @return the submitted job response
     * @throws SabException if submission fails
     */
    public JobResponse submitJob(JobSubmissionRequest jobRequest) {
        return jobService.submitJob(jobRequest);
    }

    /**
     * Submits a new job for execution asynchronously.
     *
     * @param jobRequest the job submission request
     * @return Mono containing the submitted job response
     */
    public Mono<JobResponse> submitJobAsync(JobSubmissionRequest jobRequest) {
        return jobService.submitJobAsync(jobRequest);
    }

    /**
     * Retrieves a job by its ID.
     *
     * @param jobId the job ID
     * @return the job response if found
     * @throws SabException if retrieval fails
     */
    public Optional<JobResponse> getJob(String jobId) {
        return jobService.getJob(jobId);
    }

    /**
     * Retrieves a job by its ID asynchronously.
     *
     * @param jobId the job ID
     * @return Mono containing the job response if found
     */
    public Mono<Optional<JobResponse>> getJobAsync(String jobId) {
        return jobService.getJobAsync(jobId);
    }

    /**
     * Lists jobs for the current tenant.
     *
     * @return list of job responses
     * @throws SabException if listing fails
     */
    public List<JobResponse> listJobs() {
        return jobService.listJobs();
    }

    /**
     * Lists jobs for the current tenant asynchronously.
     *
     * @return Mono containing list of job responses
     */
    public Mono<List<JobResponse>> listJobsAsync() {
        return jobService.listJobsAsync();
    }

    /**
     * Cancels a job.
     *
     * @param jobId the job ID to cancel
     * @return true if cancellation was successful
     * @throws SabException if cancellation fails
     */
    public boolean cancelJob(String jobId) {
        return jobService.cancelJob(jobId);
    }

    /**
     * Cancels a job asynchronously.
     *
     * @param jobId the job ID to cancel
     * @return Mono containing true if cancellation was successful
     */
    public Mono<Boolean> cancelJobAsync(String jobId) {
        return jobService.cancelJobAsync(jobId);
    }

    /**
     * Creates a new schedule.
     *
     * @param scheduleRequest the schedule creation request
     * @return the created schedule response
     * @throws SabException if creation fails
     */
    public ScheduleResponse createSchedule(ScheduleRequest scheduleRequest) {
        return scheduleService.createSchedule(scheduleRequest);
    }

    /**
     * Creates a new schedule asynchronously.
     *
     * @param scheduleRequest the schedule creation request
     * @return Mono containing the created schedule response
     */
    public Mono<ScheduleResponse> createScheduleAsync(ScheduleRequest scheduleRequest) {
        return scheduleService.createScheduleAsync(scheduleRequest);
    }

    /**
     * Lists schedules for the current tenant.
     *
     * @return list of schedule responses
     * @throws SabException if listing fails
     */
    public List<ScheduleResponse> listSchedules() {
        return scheduleService.listSchedules();
    }

    /**
     * Lists schedules for the current tenant asynchronously.
     *
     * @return Mono containing list of schedule responses
     */
    public Mono<List<ScheduleResponse>> listSchedulesAsync() {
        return scheduleService.listSchedulesAsync();
    }

    /**
     * Cancels a schedule.
     *
     * @param scheduleId the schedule ID to cancel
     * @return true if cancellation was successful
     * @throws SabException if cancellation fails
     */
    public boolean cancelSchedule(String scheduleId) {
        return scheduleService.cancelSchedule(scheduleId);
    }

    /**
     * Cancels a schedule asynchronously.
     *
     * @param scheduleId the schedule ID to cancel
     * @return Mono containing true if cancellation was successful
     */
    public Mono<Boolean> cancelScheduleAsync(String scheduleId) {
        return scheduleService.cancelScheduleAsync(scheduleId);
    }

    /**
     * Gets cluster statistics.
     *
     * @return cluster statistics
     * @throws SabException if retrieval fails
     */
    public ClusterStats getClusterStats() {
        return adminService.getClusterStats();
    }

    /**
     * Gets cluster statistics asynchronously.
     *
     * @return Mono containing cluster statistics
     */
    public Mono<ClusterStats> getClusterStatsAsync() {
        return adminService.getClusterStatsAsync();
    }

    /**
     * Gets queue statistics for the current tenant.
     *
     * @return queue statistics
     * @throws SabException if retrieval fails
     */
    public QueueStats getQueueStats() {
        return adminService.getQueueStats();
    }

    /**
     * Gets queue statistics for the current tenant asynchronously.
     *
     * @return Mono containing queue statistics
     */
    public Mono<QueueStats> getQueueStatsAsync() {
        return adminService.getQueueStatsAsync();
    }

    /**
     * Lists dead letter queue items.
     *
     * @return list of DLQ items
     * @throws SabException if retrieval fails
     */
    public List<DLQItem> listDLQ() {
        return adminService.listDLQ();
    }

    /**
     * Lists dead letter queue items asynchronously.
     *
     * @return Mono containing list of DLQ items
     */
    public Mono<List<DLQItem>> listDLQAsync() {
        return adminService.listDLQAsync();
    }

    /**
     * Retries a job from the dead letter queue.
     *
     * @param jobId the job ID to retry
     * @return true if retry was successful
     * @throws SabException if retry fails
     */
    public boolean retryDLQJob(String jobId) {
        return adminService.retryDLQJob(jobId);
    }

    /**
     * Retries a job from the dead letter queue asynchronously.
     *
     * @param jobId the job ID to retry
     * @return Mono containing true if retry was successful
     */
    public Mono<Boolean> retryDLQJobAsync(String jobId) {
        return adminService.retryDLQJobAsync(jobId);
    }

    /**
     * Builder class for SabClient.
     */
    public static class Builder {
        private SabConfig config;
        private WebClient webClient;
        private Tracer tracer;

        public Builder() {
            this.config = SabConfig.builder().build();
        }

        /**
         * Sets the configuration for the client.
         *
         * @param config the configuration
         * @return this builder instance
         */
        public Builder config(SabConfig config) {
            this.config = config;
            return this;
        }

        /**
         * Sets the base URL for the SAB API.
         *
         * @param baseUrl the base URL
         * @return this builder instance
         */
        public Builder baseUrl(String baseUrl) {
            this.config = this.config.toBuilder().baseUrl(baseUrl).build();
            return this;
        }

        /**
         * Sets the API key for authentication.
         *
         * @param apiKey the API key
         * @return this builder instance
         */
        public Builder apiKey(String apiKey) {
            this.config = this.config.toBuilder().apiKey(apiKey).build();
            return this;
        }

        /**
         * Sets the tenant ID.
         *
         * @param tenantId the tenant ID
         * @return this builder instance
         */
        public Builder tenantId(String tenantId) {
            this.config = this.config.toBuilder().tenantId(tenantId).build();
            return this;
        }

        /**
         * Sets the timeout for HTTP requests.
         *
         * @param timeout the timeout duration
         * @return this builder instance
         */
        public Builder timeout(Duration timeout) {
            this.config = this.config.toBuilder().timeout(timeout).build();
            return this;
        }

        /**
         * Sets the retry configuration.
         *
         * @param maxAttempts maximum retry attempts
         * @param backoff backoff duration between retries
         * @return this builder instance
         */
        public Builder retry(int maxAttempts, Duration backoff) {
            this.config = this.config.toBuilder()
                    .maxRetries(maxAttempts)
                    .retryBackoff(backoff)
                    .build();
            return this;
        }

        /**
         * Sets a custom WebClient.
         *
         * @param webClient the web client
         * @return this builder instance
         */
        public Builder webClient(WebClient webClient) {
            this.webClient = webClient;
            return this;
        }

        /**
         * Sets a custom Tracer for OpenTelemetry.
         *
         * @param tracer the tracer
         * @return this builder instance
         */
        public Builder tracer(Tracer tracer) {
            this.tracer = tracer;
            return this;
        }

        /**
         * Builds the SabClient instance.
         *
         * @return the configured SabClient
         */
        public SabClient build() {
            if (this.webClient == null) {
                this.webClient = createDefaultWebClient();
            }
            if (this.tracer == null) {
                this.tracer = OpenTelemetry.noop().getTracer("sab-java-sdk");
            }
            return new SabClient(this);
        }

        private WebClient createDefaultWebClient() {
            return WebClient.builder()
                    .baseUrl(config.getBaseUrl())
                    .defaultHeaders(headers -> {
                        headers.set("X-API-Key", config.getApiKey());
                        headers.set("X-Tenant-ID", config.getTenantId());
                        headers.set("Content-Type", "application/json");
                        headers.set("User-Agent", "sab-java-sdk/2.0.0");
                    })
                    .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                    .build();
        }
    }
}
