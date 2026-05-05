// Redis queue repository implementation for SAB job scheduling platform
// This repository implements queue operations using Redis sorted sets (ZSET)
// as priority queues. It provides atomic operations for job claiming and
// queue management with optimistic locking patterns.
//
// Key features:
// - Redis ZSET as min-heap for priority scheduling
// - Atomic job claiming via WATCH/MULTI/EXEC (CAS pattern)
// - Multi-tenant queue isolation with key prefixes
// - Efficient queue size monitoring and bulk operations
// - Non-blocking SCAN operations for maintenance
package com.learnerview.sab.repository;

// Configuration imports
import com.learnerview.sab.config.SchedulerProperties;
// Model imports
import com.learnerview.sab.model.JobPriority;
// Spring and utility imports
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Repository;

// Character encoding and collection imports
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

// Redis repository implementation using ZSET as min-heap
// Score = scheduledAt epoch ms, member = jobId for time-based ordering
// Atomic claim via WATCH/MULTI/EXEC (optimistic locking / CAS pattern)
@Repository
@Slf4j
public class RedisQueueRepository implements QueueRepository {
    
    // Redis template for string operations
    private final StringRedisTemplate redis;
    // Queue key prefix for multi-tenant isolation
    private final String queuePrefix;
    
    // Constructor with dependency injection
    public RedisQueueRepository(StringRedisTemplate redis, SchedulerProperties props) {
        this.redis = redis;
        this.queuePrefix = props.getScheduler().getQueuePrefix();
    }
// Enqueue a job into the Redis priority queue
    // Adds the job to a ZSET with the scheduled time as score for natural ordering
    public void enqueue(String tenantId, String jobId, JobPriority priority, long scheduledAtEpochMs) {
        redis.opsForZSet().add(queueKey(tenantId, priority), jobId, scheduledAtEpochMs);
    }
    
    // Atomically claim the next ready job using WATCH/MULTI/EXEC (CAS pattern)
    // If another worker claims it first, EXEC returns null and we skip
    @SuppressWarnings("unchecked")
    public Optional<String> claimNextReady(String tenantId, JobPriority priority) {
        String key = queueKey(tenantId, priority);
        long now = System.currentTimeMillis();
        return redis.execute(new SessionCallback<Optional<String>>() {
            @Override
            public Optional<String> execute(RedisOperations ops) throws DataAccessException {
                // Watch the key for changes during transaction
                ops.watch(key);
                // Find the earliest scheduled job that's ready now
                Set<ZSetOperations.TypedTuple<String>> results =
                        ops.opsForZSet().rangeByScoreWithScores(key, 0, now, 0, 1);
                if (results == null || results.isEmpty()) {
                    ops.unwatch();
                    return Optional.empty();
                }
                String jobId = results.iterator().next().getValue();
                // Start transaction to atomically claim the job
                ops.multi();
                ops.opsForZSet().remove(key, jobId);
                List<Object> execResult = ops.exec();
                if (execResult == null || execResult.isEmpty()) {
                    return Optional.empty(); // lost race
                }
                return Optional.of(jobId);
            }
        });
    }
// Remove a specific job from the queue
    public void remove(String tenantId, String jobId, JobPriority priority) {
        redis.opsForZSet().remove(queueKey(tenantId, priority), jobId);
    }
// Get the current size of a specific queue
    public long queueSize(String tenantId, JobPriority priority) {
        Long size = redis.opsForZSet().zCard(queueKey(tenantId, priority));
        return size != null ? size : 0;
    }
// Get the total size across all tenants for a specific priority
    public long queueSizeAll(JobPriority priority) {
        long total = 0L;
        for (String tenantId : listTenantIdsWithJobs()) {
            total += queueSize(tenantId, priority);
        }
        return total;
    }
// Clear all jobs from a specific queue
    public void clearQueue(String tenantId, JobPriority priority) {
        redis.delete(queueKey(tenantId, priority));
    }
// List all tenant IDs that currently have jobs in queues
    public java.util.List<String> listTenantIdsWithJobs() {
        String pattern = queuePrefix + ":*";
        ScanOptions options = ScanOptions.scanOptions().match(pattern).count(500).build();
        Set<String> tenants = new java.util.HashSet<>();
        redis.execute((org.springframework.data.redis.core.RedisCallback<Void>) connection -> {
            try (var cursor = connection.scan(options)) {
                while (cursor.hasNext()) {
                    String key = new String(cursor.next(), StandardCharsets.UTF_8);
                    String tenant = tenantFromKey(key);
                    if (tenant != null && !tenant.isBlank()) {
                        tenants.add(tenant);
                    }
                }
            }
            return null;
        });
        if (tenants.isEmpty()) return java.util.List.of();
        return new ArrayList<>(tenants);
    }
// Clear all queues across all tenants and priorities
    // This uses SCAN to avoid blocking Redis with KEYS command
    public void clearAll() {
        ScanOptions options = ScanOptions.scanOptions().match(queuePrefix + ":*").count(500).build();
        List<String> batch = new ArrayList<>(500);
        redis.execute((org.springframework.data.redis.core.RedisCallback<Void>) connection -> {
            try (var cursor = connection.scan(options)) {
                while (cursor.hasNext()) {
                    batch.add(new String(cursor.next(), StandardCharsets.UTF_8));
                    if (batch.size() >= 500) {
                        redis.delete(batch);
                        batch.clear();
                    }
                }
            }
            return null;
        });
        if (!batch.isEmpty()) {
            redis.delete(batch);
        }
    }
// Generate queue key for a specific tenant and priority
    private String queueKey(String tenantId, JobPriority priority) {
        return queuePrefix + ":" + tenantId + ":" + priority.name().toLowerCase();
    }
    
    // Extract tenant ID from queue key
    private String tenantFromKey(String key) {
        if (key == null) return null;
        String prefix = queuePrefix + ":";
        if (!key.startsWith(prefix)) return null;
        String remainder = key.substring(prefix.length());
        int idx = remainder.lastIndexOf(':');
        if (idx <= 0) return null;
        return remainder.substring(0, idx);
    }
}


