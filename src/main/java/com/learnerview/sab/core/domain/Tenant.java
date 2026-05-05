package com.learnerview.sab.core.domain;

public record Tenant(
        String id,
        String tier,
        int rateLimitRpm
) {
}


