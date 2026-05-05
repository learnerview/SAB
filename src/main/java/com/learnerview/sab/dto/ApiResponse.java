// Generic API response wrapper for consistent response format
package com.learnerview.sab.dto;

// Jackson annotation for JSON serialization
import com.fasterxml.jackson.annotation.JsonInclude;
// Lombok annotations for boilerplate code generation
import lombok.Builder;
import lombok.Data;
// Time handling
import java.time.Instant;

// Data class with builder pattern and non-null JSON inclusion
@Data @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    // Success status indicator
    private boolean success;
    // Response message
    private String message;
    // Generic response data
    private T data;
    // Timestamp with default current time
    @Builder.Default
    private Instant timestamp = Instant.now();
}
