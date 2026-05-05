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
 * Service for handling admin-related operations.
 */
@Slf4j
@RequiredArgsConstructor
public class AdminService {
    private final WebClient webClient;
    private final SabConfig config;
    private final Tracer tracer;

    /**
     * Gets cluster statistics.
     *
     * @return cluster statistics
     * @throws SabException if retrieval fails
     */
    public ClusterStats getClusterStats() {
        return getClusterStatsAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Gets cluster statistics asynchronously.
     *
     * @return Mono containing cluster statistics
     */
    public Mono<ClusterStats> getClusterStatsAsync() {
        Span span = tracer.spanBuilder("sab.admin.cluster.stats").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/admin/stats")
                .retrieve()
                .bodyToMono(ClusterStatsResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to get cluster stats: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(stats -> {
                    span.setAttribute("cluster.jobs.total", stats.getTotalJobs());
                    span.setAttribute("cluster.jobs.running", stats.getRunningJobs());
                    log.info("Retrieved cluster stats: total={}, running={}", stats.getTotalJobs(), stats.getRunningJobs());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to get cluster stats", error);
                })
                .onErrorMap(error -> new SabException("Failed to get cluster stats", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Gets queue statistics for the current tenant.
     *
     * @return queue statistics
     * @throws SabException if retrieval fails
     */
    public QueueStats getQueueStats() {
        return getQueueStatsAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Gets queue statistics for the current tenant asynchronously.
     *
     * @return Mono containing queue statistics
     */
    public Mono<QueueStats> getQueueStatsAsync() {
        Span span = tracer.spanBuilder("sab.admin.queue.stats").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/admin/metrics")
                .retrieve()
                .bodyToMono(QueueStatsResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to get queue stats: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(stats -> {
                    span.setAttribute("queue.jobs.queued", stats.getQueued());
                    span.setAttribute("queue.jobs.running", stats.getRunning());
                    log.info("Retrieved queue stats: queued={}, running={}", stats.getQueued(), stats.getRunning());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to get queue stats", error);
                })
                .onErrorMap(error -> new SabException("Failed to get queue stats", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Lists dead letter queue items.
     *
     * @return list of DLQ items
     * @throws SabException if retrieval fails
     */
    public List<DLQItem> listDLQ() {
        return listDLQAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Lists dead letter queue items asynchronously.
     *
     * @return Mono containing list of DLQ items
     */
    public Mono<List<DLQItem>> listDLQAsync() {
        Span span = tracer.spanBuilder("sab.admin.dlq.list").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/admin/dlq")
                .retrieve()
                .bodyToMono(DLQListResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to list DLQ: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(items -> {
                    span.setAttribute("dlq.items.count", items.size());
                    log.info("Retrieved {} DLQ items", items.size());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to list DLQ items", error);
                })
                .onErrorMap(error -> new SabException("Failed to list DLQ items", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Retries a job from the dead letter queue.
     *
     * @param jobId the job ID to retry
     * @return true if retry was successful
     * @throws SabException if retry fails
     */
    public boolean retryDLQJob(String jobId) {
        return retryDLQJobAsync(jobId).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Retries a job from the dead letter queue asynchronously.
     *
     * @param jobId the job ID to retry
     * @return Mono containing true if retry was successful
     */
    public Mono<Boolean> retryDLQJobAsync(String jobId) {
        Span span = tracer.spanBuilder("sab.admin.dlq.retry")
            .setAttribute("job.id", jobId)
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.post()
                .uri("/api/v1/admin/dlq/{jobId}/retry", jobId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Void>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to retry DLQ job: " + response.getMessage());
                    }
                    return true;
                })
                .doOnSuccess(success -> {
                    span.setAttribute("job.retried", true);
                    log.info("Successfully retried DLQ job: {}", jobId);
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to retry DLQ job: {}", jobId, error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30)))
                .onErrorReturn(false)
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Lists API keys.
     *
     * @return list of API keys
     * @throws SabException if retrieval fails
     */
    public List<ApiKeyInfo> listApiKeys() {
        return listApiKeysAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Lists API keys asynchronously.
     *
     * @return Mono containing list of API keys
     */
    public Mono<List<ApiKeyInfo>> listApiKeysAsync() {
        Span span = tracer.spanBuilder("sab.admin.keys.list").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.get()
                .uri("/api/v1/admin/keys")
                .retrieve()
                .bodyToMono(ApiKeyListResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to list API keys: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(keys -> {
                    span.setAttribute("keys.count", keys.size());
                    log.info("Retrieved {} API keys", keys.size());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to list API keys", error);
                })
                .onErrorMap(error -> new SabException("Failed to list API keys", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Creates a new API key.
     *
     * @param request the API key creation request
     * @return the created API key info
     * @throws SabException if creation fails
     */
    public ApiKeyInfo createApiKey(ApiKeyRequest request) {
        return createApiKeyAsync(request).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 10));
    }

    /**
     * Creates a new API key asynchronously.
     *
     * @param request the API key creation request
     * @return Mono containing the created API key info
     */
    public Mono<ApiKeyInfo> createApiKeyAsync(ApiKeyRequest request) {
        Span span = tracer.spanBuilder("sab.admin.keys.create")
            .setAttribute("key.label", request.getLabel())
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.post()
                .uri("/api/v1/admin/keys")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ApiKeyResponse.class)
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to create API key: " + response.getMessage());
                    }
                    return response.getData();
                })
                .doOnSuccess(keyInfo -> {
                    span.setAttribute("key.id", keyInfo.getId());
                    log.info("Successfully created API key: {}", keyInfo.getId());
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to create API key", error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30)))
                .onErrorMap(error -> new SabException("Failed to create API key", error))
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Deletes an API key.
     *
     * @param keyId the key ID to delete
     * @return true if deletion was successful
     * @throws SabException if deletion fails
     */
    public boolean deleteApiKey(String keyId) {
        return deleteApiKeyAsync(keyId).block(Duration.ofSeconds(config.getTimeout().getSeconds() + 5));
    }

    /**
     * Deletes an API key asynchronously.
     *
     * @param keyId the key ID to delete
     * @return Mono containing true if deletion was successful
     */
    public Mono<Boolean> deleteApiKeyAsync(String keyId) {
        Span span = tracer.spanBuilder("sab.admin.keys.delete")
            .setAttribute("key.id", keyId)
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.delete()
                .uri("/api/v1/admin/keys/{keyId}", keyId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Void>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to delete API key: " + response.getMessage());
                    }
                    return true;
                })
                .doOnSuccess(success -> {
                    span.setAttribute("key.deleted", true);
                    log.info("Successfully deleted API key: {}", keyId);
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to delete API key: {}", keyId, error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30)))
                .onErrorReturn(false)
                .doFinally(signal -> span.end());
        }
    }

    /**
     * Clears all queues.
     *
     * @return true if clearing was successful
     * @throws SabException if clearing fails
     */
    public boolean clearQueues() {
        return clearQueuesAsync().block(Duration.ofSeconds(config.getTimeout().getSeconds() + 10));
    }

    /**
     * Clears all queues asynchronously.
     *
     * @return Mono containing true if clearing was successful
     */
    public Mono<Boolean> clearQueuesAsync() {
        Span span = tracer.spanBuilder("sab.admin.queues.clear").startSpan();
        try (Scope scope = span.makeCurrent()) {
            return webClient.delete()
                .uri("/api/v1/admin/queues")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Void>>() {})
                .map(response -> {
                    if (!response.isSuccess()) {
                        throw new SabException("Failed to clear queues: " + response.getMessage());
                    }
                    return true;
                })
                .doOnSuccess(success -> {
                    span.setAttribute("queues.cleared", true);
                    log.info("Successfully cleared all queues");
                })
                .doOnError(error -> {
                    span.recordException(error);
                    log.error("Failed to clear queues", error);
                })
                .retryWhen(Retry.backoff(config.getMaxRetries(), config.getRetryBackoff())
                    .maxBackoff(Duration.ofSeconds(30)))
                .onErrorReturn(false)
                .doFinally(signal -> span.end());
        }
    }
}
