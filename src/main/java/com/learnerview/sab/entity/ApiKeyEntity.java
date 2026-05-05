// API key entity for SAB job scheduling platform
// This JPA entity represents API keys used for client authentication
// in the SAB system. Keys are stored as SHA-256 hashes for
// security and support multi-tenant isolation through producer association.
//
// Key features:
// - SHA-256 hashed API keys for secure storage
// - Multi-tenant isolation through producer field
// - Active/inactive status for key lifecycle management
// - Admin role designation for elevated permissions
// - Audit trail through creation timestamps
// - Optional labels for key identification and management
package com.learnerview.sab.entity;

// JPA annotations for entity mapping
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
// Lombok annotations for boilerplate code generation
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Time handling
import java.time.Instant;

// JPA entity representing API keys in the database
// Maps to the 'api_keys' table with comprehensive indexing
// and constraints for data integrity and security
@Entity
@Table(name = "api_keys")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApiKeyEntity {

    // Primary key identifier for the API key
    @Id
    @Column(length = 36)
    private String id;

    // SHA-256 hash of the actual API key (never stored in plaintext)
    // Unique constraint ensures no duplicate hashes
    @Column(length = 100, nullable = false, unique = true)
    private String apiKey;

    // Producer/tenant identifier for multi-tenant isolation
    // Associates the key with a specific tenant or client
    @Column(length = 120, nullable = false)
    private String producer;

    // Optional human-readable label for key identification
    // Useful for key management and auditing purposes
    @Column(length = 255)
    private String label;

    // Active status flag for key lifecycle management
    // Only active keys can be used for authentication
    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    // Administrative role flag for elevated permissions
    // Admin keys can access administrative endpoints
    @Builder.Default
    @Column(name = "is_admin", nullable = false)
    private boolean admin = false;

    // Creation timestamp for audit trail
    // Set at creation time and never updated
    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
