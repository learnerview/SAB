package com.learnerview.sab.core.domain;

public record Schedule(
        String id,
        String tenantId,
        String cron,
        JobTemplate template,
        boolean active
) {
}


