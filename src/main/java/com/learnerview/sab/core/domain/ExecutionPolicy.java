package com.learnerview.sab.core.domain;

public record ExecutionPolicy(
        String type,
        String endpoint,
        Integer timeoutSeconds,
        String callbackUrl
) {
}


