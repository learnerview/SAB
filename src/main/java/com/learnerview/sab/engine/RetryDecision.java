package com.learnerview.sab.engine;

import java.time.Instant;

public record RetryDecision(
        boolean shouldRetry,
        Instant nextRunAt,
        String failureMessage
) {
}


