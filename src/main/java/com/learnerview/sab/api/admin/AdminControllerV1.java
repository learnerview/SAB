// Admin API controller for administrative operations
package com.learnerview.sab.api.admin;

// DTO imports for request/response objects
import com.learnerview.sab.dto.ApiKeyRequest;
import com.learnerview.sab.dto.ApiKeyResponse;
import com.learnerview.sab.dto.ApiResponse;
import com.learnerview.sab.dto.JobResponse;
import com.learnerview.sab.dto.QueueStatsResponse;
// Service layer import
import com.learnerview.sab.service.AdminService;
// Spring framework imports
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Utility imports
import java.util.List;
import java.util.Map;

// REST controller for admin endpoints, active in 'api' profile
@RestController
@RequestMapping("/api/v1/admin")
@Profile("api")
@RequiredArgsConstructor
public class AdminControllerV1 {

    // Admin service for business logic
    private final AdminService adminService;

    // Get cluster statistics and queue information
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<QueueStatsResponse>> stats() {
        // Return queue statistics in API response format
        return ResponseEntity.ok(ApiResponse.<QueueStatsResponse>builder()
                .success(true).data(adminService.getStats()).build());
    }

    // Get queue statistics (alias for stats endpoint)
    @GetMapping("/queues")
    public ResponseEntity<ApiResponse<QueueStatsResponse>> queues() {
        // Return queue statistics in API response format
        return ResponseEntity.ok(ApiResponse.<QueueStatsResponse>builder()
                .success(true).data(adminService.getStats()).build());
    }

    // Get application metrics for monitoring
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Number>>> metrics() {
        // Return metrics map in API response format
        return ResponseEntity.ok(ApiResponse.<Map<String, Number>>builder()
                .success(true).data(adminService.getMetrics()).build());
    }

    // Clear all queues (admin operation)
    @DeleteMapping("/queues")
    public ResponseEntity<ApiResponse<Void>> clearQueues() {
        // Clear all queues and return success response
        adminService.clearQueues();
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("All queues cleared").build());
    }

    // Get dead letter queue jobs
    @GetMapping("/dlq")
    public ResponseEntity<ApiResponse<List<JobResponse>>> dlq() {
        // Return DLQ jobs list in API response format
        return ResponseEntity.ok(ApiResponse.<List<JobResponse>>builder()
                .success(true).data(adminService.getDlqJobs()).build());
    }

    // Retry a specific DLQ job
    @PostMapping("/dlq/{id}/retry")
    public ResponseEntity<ApiResponse<Void>> retryDlq(@PathVariable String id) {
        // Retry the specified DLQ job and return success response
        adminService.retryDlqJob(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Job re-queued from DLQ").build());
    }

    // List all API keys
    @GetMapping("/keys")
    public ResponseEntity<ApiResponse<List<ApiKeyResponse>>> listKeys() {
        // Return API keys list in API response format
        return ResponseEntity.ok(ApiResponse.<List<ApiKeyResponse>>builder()
                .success(true).data(adminService.listKeys()).build());
    }

    // Create a new API key
    @PostMapping("/keys")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> createKey(@RequestBody ApiKeyRequest request) {
        // Create new API key and return with 201 status
        return ResponseEntity.status(201).body(ApiResponse.<ApiKeyResponse>builder()
                .success(true).message("API Key issued").data(adminService.createKey(request)).build());
    }

    // Revoke an API key
    @DeleteMapping("/keys/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeKey(@PathVariable String id) {
        // Revoke the specified API key and return success response
        adminService.revokeKey(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("API Key revoked").build());
    }
}
