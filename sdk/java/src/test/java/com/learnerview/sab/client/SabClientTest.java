package com.learnerview.sab.client;

import com.learnerview.sab.config.SabConfig;
import com.learnerview.sab.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockserver.client.MockServerClient;
import org.mockserver.junit.jupiter.MockServerExtension;
import org.mockserver.model.HttpRequest;
import org.mockserver.model.HttpResponse;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockserver.model.JsonBody.json;

/**
 * Integration tests for SabClient.
 */
@ExtendWith(MockServerExtension.class)
class SabClientTest {
    private SabClient client;
    private MockServerClient mockServer;

    @BeforeEach
    void setUp(MockServerClient mockServerClient) {
        this.mockServer = mockServerClient;
        SabConfig config = SabConfig.builder()
            .baseUrl("http://" + mockServerClient.remoteAddress().getHostName() + ":" + mockServerClient.remoteAddress().getPort())
            .apiKey("test-api-key")
            .tenantId("test-tenant")
            .timeout(Duration.ofSeconds(10))
            .maxRetries(2)
            .retryBackoff(Duration.ofMillis(100))
            .build();
        this.client = SabClient.builder()
            .config(config)
            .build();
    }

    @Test
    void testSubmitJob() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/jobs")
            .withMethod("POST"))
            .respond(HttpResponse.response()
                .withStatusCode(201)
                .withBody(json(ApiResponse.<JobResponse>builder()
                    .success(true)
                    .message("Job submitted successfully")
                    .data(JobResponse.builder()
                        .jobId("job-123")
                        .jobType("webhook")
                        .priority(JobPriority.NORMAL)
                        .status(JobStatus.QUEUED)
                        .build())
                    .build())));

        JobSubmissionRequest request = JobSubmissionRequest.builder()
            .jobType("webhook")
            .priority(JobPriority.NORMAL)
            .payload(Map.of("key", "value"))
            .execution(JobSubmissionRequest.ExecutionPolicy.builder()
                .type("HTTP")
                .endpoint("https://example.com/webhook")
                .timeoutSeconds(30)
                .build())
            .build();

        JobResponse response = client.submitJob(request);
        assertNotNull(response);
        assertEquals("job-123", response.getJobId());
        assertEquals("webhook", response.getJobType());
        assertEquals(JobStatus.QUEUED, response.getStatus());
    }

    @Test
    void testGetJob() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/jobs/job-123")
            .withMethod("GET"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(ApiResponse.<JobResponse>builder()
                    .success(true)
                    .data(JobResponse.builder()
                        .jobId("job-123")
                        .jobType("webhook")
                        .priority(JobPriority.NORMAL)
                        .status(JobStatus.RUNNING)
                        .build())
                    .build())));

        Optional<JobResponse> response = client.getJob("job-123");
        assertTrue(response.isPresent());
        assertEquals("job-123", response.get().getJobId());
        assertEquals(JobStatus.RUNNING, response.get().getStatus());
    }

    @Test
    void testListJobs() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/jobs")
            .withMethod("GET"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(JobListResponse.builder()
                    .success(true)
                    .data(List.of(
                        JobResponse.builder()
                            .jobId("job-123")
                            .jobType("webhook")
                            .priority(JobPriority.NORMAL)
                            .status(JobStatus.QUEUED)
                            .build(),
                        JobResponse.builder()
                            .jobId("job-456")
                            .jobType("webhook")
                            .priority(JobPriority.HIGH)
                            .status(JobStatus.RUNNING)
                            .build()
                    ))
                    .build())));

        List<JobResponse> jobs = client.listJobs();
        assertNotNull(jobs);
        assertEquals(2, jobs.size());
        assertEquals("job-123", jobs.get(0).getJobId());
        assertEquals("job-456", jobs.get(1).getJobId());
    }

    @Test
    void testCancelJob() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/jobs/job-123")
            .withMethod("DELETE"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Job cancelled successfully")
                    .build())));

        boolean result = client.cancelJob("job-123");
        assertTrue(result);
    }

    @Test
    void testCreateSchedule() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/schedules")
            .withMethod("POST"))
            .respond(HttpResponse.response()
                .withStatusCode(201)
                .withBody(json(ApiResponse.<ScheduleResponse>builder()
                    .success(true)
                    .message("Schedule created successfully")
                    .data(ScheduleResponse.builder()
                        .id("schedule-123")
                        .cron("0 0 * * *")
                        .jobType("webhook")
                        .priority(JobPriority.NORMAL)
                        .active(true)
                        .build())
                    .build())));

        ScheduleRequest request = ScheduleRequest.builder()
            .cron("0 0 * * *")
            .jobType("webhook")
            .priority(JobPriority.NORMAL)
            .payload(Map.of("key", "value"))
            .execution(JobSubmissionRequest.ExecutionPolicy.builder()
                .type("HTTP")
                .endpoint("https://example.com/webhook")
                .timeoutSeconds(30)
                .build())
            .build();

        ScheduleResponse response = client.createSchedule(request);
        assertNotNull(response);
        assertEquals("schedule-123", response.getId());
        assertEquals("0 0 * * *", response.getCron());
        assertEquals("webhook", response.getJobType());
        assertTrue(response.isActive());
    }

    @Test
    void testListSchedules() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/schedules")
            .withMethod("GET"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(ScheduleListResponse.builder()
                    .success(true)
                    .data(List.of(
                        ScheduleResponse.builder()
                            .id("schedule-123")
                            .cron("0 0 * * *")
                            .jobType("webhook")
                            .priority(JobPriority.NORMAL)
                            .active(true)
                            .build(),
                        ScheduleResponse.builder()
                            .id("schedule-456")
                            .cron("0 12 * * *")
                            .jobType("webhook")
                            .priority(JobPriority.HIGH)
                            .active(true)
                            .build()
                    ))
                    .build())));

        List<ScheduleResponse> schedules = client.listSchedules();
        assertNotNull(schedules);
        assertEquals(2, schedules.size());
        assertEquals("schedule-123", schedules.get(0).getId());
        assertEquals("schedule-456", schedules.get(1).getId());
    }

    @Test
    void testCancelSchedule() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/schedules/schedule-123")
            .withMethod("DELETE"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Schedule cancelled successfully")
                    .build())));

        boolean result = client.cancelSchedule("schedule-123");
        assertTrue(result);
    }

    @Test
    void testGetClusterStats() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/admin/stats")
            .withMethod("GET"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(ClusterStatsResponse.builder()
                    .success(true)
                    .data(ClusterStats.builder()
                        .totalJobs(100L)
                        .runningJobs(10L)
                        .queuedJobs(20L)
                        .successfulJobs(60L)
                        .failedJobs(8L)
                        .dlqJobs(2L)
                        .activeWorkers(5)
                        .build())
                    .build())));

        ClusterStats stats = client.getClusterStats();
        assertNotNull(stats);
        assertEquals(100L, stats.getTotalJobs());
        assertEquals(10L, stats.getRunningJobs());
        assertEquals(20L, stats.getQueuedJobs());
    }

    @Test
    void testGetQueueStats() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/admin/metrics")
            .withMethod("GET"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(QueueStatsResponse.builder()
                    .success(true)
                    .data(QueueStats.builder()
                        .queued(20L)
                        .running(10L)
                        .dlq(2L)
                        .total(32L)
                        .build())
                    .build())));

        QueueStats stats = client.getQueueStats();
        assertNotNull(stats);
        assertEquals(20L, stats.getQueued());
        assertEquals(10L, stats.getRunning());
    }

    @Test
    void testListDLQ() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/admin/dlq")
            .withMethod("GET"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(DLQListResponse.builder()
                    .success(true)
                    .data(List.of(
                        DLQItem.builder()
                            .jobId("job-123")
                            .jobType("webhook")
                            .lastError("Connection timeout")
                            .attempts(3)
                            .build(),
                        DLQItem.builder()
                            .jobId("job-456")
                            .jobType("webhook")
                            .lastError("HTTP 500")
                            .attempts(3)
                            .build()
                    ))
                    .build())));

        List<DLQItem> dlqItems = client.listDLQ();
        assertNotNull(dlqItems);
        assertEquals(2, dlqItems.size());
        assertEquals("job-123", dlqItems.get(0).getJobId());
        assertEquals("job-456", dlqItems.get(1).getJobId());
    }

    @Test
    void testRetryDLQJob() {
        // Mock response
        mockServer.when(HttpRequest.request("/api/v1/admin/dlq/job-123/retry")
            .withMethod("POST"))
            .respond(HttpResponse.response()
                .withStatusCode(200)
                .withBody(json(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Job retried successfully")
                    .build())));

        boolean result = client.retryDLQJob("job-123");
        assertTrue(result);
    }

    @Test
    void testBuilder() {
        SabClient builtClient = SabClient.builder()
            .baseUrl("http://localhost:8080")
            .apiKey("test-key")
            .tenantId("test-tenant")
            .timeout(Duration.ofSeconds(30))
            .retry(3, Duration.ofSeconds(1))
            .build();
        assertNotNull(builtClient);
    }
}
