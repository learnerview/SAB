package com.learnerview.sab.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * API key information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiKeyInfo {
    /**
     * API key ID.
     */
    private String id;

    /**
     * API key label.
     */
    private String label;

    /**
     * Producer/tenant ID.
     */
    private String producer;

    /**
     * API key value (only returned on creation).
     */
    private String apiKey;

    /**
     * Whether the key has admin privileges.
     */
    private Boolean isAdmin;

    /**
     * Key creation timestamp.
     */
    private Instant createdAt;

    /**
     * Key last used timestamp.
     */
    private Instant lastUsedAt;

    /**
     * Whether the key is active.
     */
    private Boolean active;
}
