package com.learnerview.sab.service;

import com.learnerview.sab.config.SabConfig;
import com.learnerview.sab.exception.SabException;
import com.learnerview.sab.model.*;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

/**
 * Service for handling schedule-related operations.
 */
@Slf4j
@RequiredArgsConstructor
public class ScheduleService {
    private final WebClient webClient;
    private final SabConfig config;
    private final Tracer tracer;

    /**
     * Creates a new schedule.
     *
     * @param scheduleRequest the schedule creation request
     * @return the created schedule response
     * @throws SabException if creation fails
     */
    public ScheduleResponse createSchedule(ScheduleRequest scheduleRequest) {
        return createScheduleAsync(scheduleRequest).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 10));
    }

    /**
     * Creates a new schedule asynchronously.
     *
     * @param scheduleRequest the schedule creation request
     * @return Mono containing the created schedule response
     */
    public Mono<ScheduleResponse> createScheduleAsync(ScheduleRequest scheduleRequest) {
        Span span = tracer.spanBuilder("sab.schedule.create")
            .setAttribute("schedule.cron", scheduleRequest.getCron())
            .setAttribute("schedule.jobType", scheduleRequest.getJobType())
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.post()
                .uri("/api/v1/schedules")
                .bodyValue(scheduleRequest)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<ScheduleResponse>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Schedule creation failed: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(response -> {
                    span.setAttribute("schedule.id", response.getId());
                    log.info("Successfully created schedule: {}", response.getId());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to create schedule", error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30))
                    .doBeforeRetry(retrySignal ->
                        log.warn("Retrying schedule creation, attempt: {}", retrySignal.totalRetries() + 1)))
                .onErrorMap(error -> new SabException("Schedule creation failed", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Lists schedules for the current tenant.
     *
     * @return list of schedule responses
     * @throws SabException if listing fails
     */
    public List<ScheduleResponse> listSchedules() {
        return listSchedulesAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Lists schedules for the current tenant asynchronously.
     *
     * @return Mono containing list of schedule responses
     */
    public Mono<List<ScheduleResponse>> listSchedulesAsync() {
        Span span = tracer.spanBuilder("sab.schedules.list").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/schedules")
                .retrieve()
                .bodyToMono(ScheduleListResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to list schedules: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(schedules -> {
                    span.setAttribute("schedules.count", schedules.size());
                    log.info("Retrieved {} schedules", schedules.size());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to list schedules", error);
                })
                .onErrorMap(error -> new SabException("Failed to list schedules", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Cancels a schedule.
     *
     * @param scheduleId the schedule ID to cancel
     * @return true if cancellation was successful
     * @throws SabException if cancellation fails
     */
    public boolean cancelSchedule(String scheduleId) {
        return cancelScheduleAsync(scheduleId).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Cancels a schedule asynchronously.
     *
     * @param scheduleId the schedule ID to cancel
     * @return Mono containing true if cancellation was successful
     */
    public Mono<Boolean> cancelScheduleAsync(String scheduleId) {
        Span span = tracer.spanBuilder("sab.schedule.cancel")
            .setAttribute("schedule.id", scheduleId)
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.delete()
                .uri("/api/v1/schedules/{scheduleId}", scheduleId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Void>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to cancel schedule: " + response.getMessage());
                    }
                    return true;
                })
                .doOnSuccess(success -> {
                    span.setAttribute("schedule.cancelled", true);
                    log.info("Successfully cancelled schedule: {}", scheduleId);
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to cancel schedule: {}", scheduleId, error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30)))
                .onErrorReturn(false)
                .doFinally(signal -> span.end());
        }
    }
}
