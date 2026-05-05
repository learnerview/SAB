// Job mapper component for converting between entity and DTO objects
package com.learnerview.sab.mapper;

// JSON processing imports
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
// Application imports
import com.learnerview.sab.dto.JobResponse;
import com.learnerview.sab.entity.JobEntity;
import com.learnerview.sab.model.JobPriority;
// Spring and Lombok imports
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

// Utility imports
import java.util.Map;

// Spring component with logging and required constructor
@Component
@Slf4j
@RequiredArgsConstructor
public class JobMapper {

    // Jackson object mapper for JSON serialization/deserialization
    private final ObjectMapper objectMapper;

    // Convert JobEntity to JobResponse DTO
    public JobResponse toResponse(JobEntity job) {
        // Deserialize payload from JSON string to Map
        Map<String, Object> payload = deserializePayload(job.getPayload());
        // Build and return response with all job properties
        return JobResponse.builder()
                .id(job.getId())
                .jobType(job.getJobType())
                .producer(job.getProducer())
                .idempotencyKey(job.getIdempotencyKey())
                .status(job.getStatus().name())
                .priority(job.getPriority().name())
                .payload(payload)
                .result(job.getResult())
                .nextRunAt(job.getNextRunAt())
                .visibleAt(job.getVisibleAt())
                .leaseOwner(job.getLeaseOwner())
                .executionType(job.getExecutionType())
                .executionEndpoint(job.getExecutionEndpoint())
                .timeoutSeconds(job.getTimeoutSeconds())
                .callbackUrl(job.getCallbackUrl())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .attemptCount(job.getAttemptCount())
                .maxAttempts(job.getMaxAttempts())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }

    // Deserialize JSON payload string to Map with error handling
    @SuppressWarnings("unchecked")
    public Map<String, Object> deserializePayload(String payload) {
        // Return empty map if payload is null
        if (payload == null) return Map.of();
        try {
            // Parse JSON string to Map
            return objectMapper.readValue(payload, Map.class);
        } catch (JsonProcessingException e) {
            // Log warning and return empty map on failure
            log.warn("Failed to deserialize payload: {}", e.getMessage());
            return Map.of();
        }
    }

    // Serialize Map payload to JSON string
    public String serializePayload(Map<String, Object> payload) {
        // Return null if payload is null
        if (payload == null) return null;
        try {
            // Convert Map to JSON string
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            // Throw exception on serialization failure
            throw new IllegalArgumentException("Invalid payload: " + e.getMessage());
        }
    }

    // Parse priority string to JobPriority enum with fallback
    public JobPriority parsePriority(String priority) {
        // Return NORMAL priority if null or blank
        if (priority == null || priority.isBlank()) return JobPriority.NORMAL;
        try {
            // Convert to uppercase and parse enum
            return JobPriority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Return NORMAL priority on invalid value
            return JobPriority.NORMAL;
        }
    }
}
