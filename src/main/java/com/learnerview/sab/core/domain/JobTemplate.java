package com.learnerview.sab.core.domain;

public record JobTemplate(
        String jobType,
        JobPriority priority,
        String payload,
        ExecutionPolicy execution,
        int maxAttempts
) {
}


