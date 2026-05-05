package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper.
 * @param <T> the type of the data field
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    /**
     * Whether the operation was successful.
     */
    private boolean success;

    /**
     * Response message.
     */
    private String message;

    /**
     * Response data.
     */
    private T data;

    /**
     * Error code (if applicable).
     */
    private String errorCode;

    /**
     * Timestamp of the response.
     */
    private long timestamp;
}
