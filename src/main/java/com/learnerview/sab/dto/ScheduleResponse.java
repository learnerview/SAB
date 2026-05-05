package com.learnerview.sab.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class ScheduleResponse {
    private String id;
    private String producer;
    private String cron;
    private String jobType;
    private String priority;
    private Map<String, Object> payload;
    private String executionType;
    private String executionEndpoint;
    private Integer timeoutSeconds;
    private String callbackUrl;
    private Integer maxAttempts;
    private Instant nextRunAt;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}


