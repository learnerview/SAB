// Utility class for hashing API keys using SHA-256
package com.learnerview.sab.security;

// Character encoding and cryptographic imports
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

// Final utility class for API key hashing
public final class ApiKeyHasher {

    // Private constructor to prevent instantiation
    private ApiKeyHasher() {
    }

    // Hash input string using SHA-256 algorithm
    public static String sha256(String input) {
        try {
            // Create SHA-256 message digest instance
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            // Compute hash of input bytes using UTF-8 encoding
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            // Convert hash bytes to hexadecimal string
            return toHex(hash);
        } catch (Exception e) {
            // Throw runtime exception if hashing fails
            throw new IllegalStateException("Failed to hash API key", e);
        }
    }

    // Convert byte array to hexadecimal string representation
    private static String toHex(byte[] bytes) {
        // StringBuilder with pre-allocated capacity
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        // Convert each byte to two-character hex string
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        // Return the complete hexadecimal string
        return sb.toString();
    }
}
