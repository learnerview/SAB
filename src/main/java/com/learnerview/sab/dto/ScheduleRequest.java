package com.learnerview.sab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class ScheduleRequest {
    @NotBlank(message = "cron is required")
    private String cron;

    @NotBlank(message = "jobType is required")
    private String jobType;

    private String priority;
    private Map<String, Object> payload;

    @NotNull(message = "execution is required")
    private ExecutionRequest execution;

    private Integer maxAttempts;

    @Data
    public static class ExecutionRequest {
        @NotBlank(message = "execution.type is required")
        private String type;

        @NotBlank(message = "execution.endpoint is required")
        private String endpoint;

        private Integer timeoutSeconds;
        private String callbackUrl;
    }
}


