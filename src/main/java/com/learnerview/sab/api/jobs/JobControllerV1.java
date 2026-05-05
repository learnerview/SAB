// REST controller for job management API v1
package com.learnerview.sab.api.jobs;

// DTO imports
import com.learnerview.sab.dto.ApiResponse;
import com.learnerview.sab.dto.HandlerInfoResponse;
import com.learnerview.sab.dto.JobResponse;
import com.learnerview.sab.dto.JobSubmissionRequest;
import com.learnerview.sab.dto.JobSubmissionResponse;
import com.learnerview.sab.dto.QueueStatsResponse;

// Service imports
import com.learnerview.sab.service.AdminService;
import com.learnerview.sab.service.JobSubmissionService;

// Spring imports
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// Java imports
import java.util.List;
import java.util.Map;

// REST controller for job operations with API v1
@RestController
@RequestMapping("/api/v1/jobs")
@Profile("api")
@RequiredArgsConstructor
public class JobControllerV1 {

    // Service dependencies
    private final JobSubmissionService submissionService;
    private final AdminService adminService;

    // Helper method to check if user has admin role
    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    // Submit a new job for execution
    @PostMapping
    public ResponseEntity<ApiResponse<JobSubmissionResponse>> submitJob(
            @AuthenticationPrincipal String producer,
            @Valid @RequestBody JobSubmissionRequest request) {
        JobSubmissionResponse resp = submissionService.submit(producer, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.<JobSubmissionResponse>builder()
                        .success(true).message("Job queued").data(resp).build());
    }

    // Retrieve job details by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobResponse>> getJob(
            Authentication auth,
            @AuthenticationPrincipal String producer,
            @PathVariable String id) {
        JobResponse resp = isAdmin(auth)
                ? submissionService.getJob(id)
                : submissionService.getJob(producer, id);
        return ResponseEntity.ok(ApiResponse.<JobResponse>builder()
                .success(true).data(resp).build());
    }

    // Cancel a job by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelJob(@AuthenticationPrincipal String producer, @PathVariable String id) {
        submissionService.cancelJob(producer, id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Job cancelled").build());
    }

    // List jobs with pagination
    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobResponse>>> listJobs(
            Authentication auth,
            @AuthenticationPrincipal String producer,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<JobResponse> jobs = isAdmin(auth)
                ? submissionService.listJobs(PageRequest.of(page, size))
                : submissionService.listJobs(producer, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.<Page<JobResponse>>builder()
                .success(true).data(jobs).build());
    }

    // Get available job types
    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<HandlerInfoResponse>>> getTypes() {
        HandlerInfoResponse external = HandlerInfoResponse.builder()
                .jobType("external")
                .description("Generic external HTTP execution")
                .handlerClass("ExternalHttpExecutor")
                .build();
        return ResponseEntity.ok(ApiResponse.<List<HandlerInfoResponse>>builder()
                .success(true).data(List.of(external)).build());
    }

    // Get job health statistics
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health(
            Authentication auth,
            @AuthenticationPrincipal String producer) {
        QueueStatsResponse stats = isAdmin(auth)
                ? adminService.getStats()
                : adminService.getStats(producer);
        Map<String, Object> health = Map.ofEntries(
                Map.entry("status", "UP"),
                Map.entry("handlers", 1),
                Map.entry("highQueueSize", stats.getHighQueueSize()),
                Map.entry("normalQueueSize", stats.getNormalQueueSize()),
                Map.entry("lowQueueSize", stats.getLowQueueSize()),
                Map.entry("totalQueued", stats.getTotalQueued()),
                Map.entry("totalRunning", stats.getTotalRunning()),
                Map.entry("totalSuccess", stats.getTotalSuccess()),
                Map.entry("totalFailed", stats.getTotalFailed()),
                Map.entry("totalDlq", stats.getTotalDlq()),
                Map.entry("totalProcessed", stats.getTotalProcessed()),
                Map.entry("successRate", stats.getSuccessRate()),
                Map.entry("retryRate", stats.getRetryRate()),
                Map.entry("throughputPerMinute", stats.getThroughputPerMinute()),
                Map.entry("avgLatencyMs", stats.getAvgLatencyMs())
        );
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true).data(health).build());
    }
}
