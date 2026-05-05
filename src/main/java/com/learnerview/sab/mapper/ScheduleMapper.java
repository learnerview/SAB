package com.learnerview.sab.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnerview.sab.core.domain.ExecutionPolicy;
import com.learnerview.sab.core.domain.JobTemplate;
import com.learnerview.sab.core.domain.Schedule;
import com.learnerview.sab.dto.ScheduleResponse;
import com.learnerview.sab.entity.ScheduleEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ScheduleMapper {

    private final ObjectMapper objectMapper;

    public Schedule toDomain(ScheduleEntity entity) {
        return new Schedule(
                entity.getId(),
                entity.getProducer(),
                entity.getCron(),
                new JobTemplate(
                        entity.getJobType(),
                    com.learnerview.sab.core.domain.JobPriority.valueOf(entity.getPriority().name()),
                        entity.getPayload(),
                        new ExecutionPolicy(
                                entity.getExecutionType(),
                                entity.getExecutionEndpoint(),
                                entity.getTimeoutSeconds(),
                                entity.getCallbackUrl()
                        ),
                        entity.getMaxAttempts()
                ),
                entity.isActive()
        );
    }

    public ScheduleResponse toResponse(ScheduleEntity entity) {
        return ScheduleResponse.builder()
                .id(entity.getId())
                .producer(entity.getProducer())
                .cron(entity.getCron())
                .jobType(entity.getJobType())
                .priority(entity.getPriority().name())
                .payload(deserializePayload(entity.getPayload()))
                .executionType(entity.getExecutionType())
                .executionEndpoint(entity.getExecutionEndpoint())
                .timeoutSeconds(entity.getTimeoutSeconds())
                .callbackUrl(entity.getCallbackUrl())
                .maxAttempts(entity.getMaxAttempts())
                .nextRunAt(entity.getNextRunAt())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public String serializePayload(Map<String, Object> payload) {
        if (payload == null) return null;
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid payload: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> deserializePayload(String payload) {
        if (payload == null || payload.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(payload, Map.class);
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }
}


