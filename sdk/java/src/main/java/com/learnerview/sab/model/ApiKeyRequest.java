package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request object for creating an API key.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiKeyRequest {
    /**
     * Label for the API key.
     */
    private String label;

    /**
     * Whether the key should have admin privileges.
     */
    private Boolean isAdmin;

    /**
     * Allowed job types for this key (if not admin).
     */
    private List<String> allowedJobTypes;
}
