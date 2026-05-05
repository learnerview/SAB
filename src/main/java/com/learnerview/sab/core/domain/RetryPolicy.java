package com.learnerview.sab.core.domain;

public record RetryPolicy(
        int maxAttempts,
        int initialDelaySeconds,
        double backoffMultiplier
) {
}


