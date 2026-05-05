package com.learnerview.sab.engine;

import com.learnerview.sab.config.SchedulerProperties;
import com.learnerview.sab.core.domain.ExecutionPolicy;
import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.JobStatus;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RetryEvaluatorTest {

    @Test
    void retriesWhenAttemptsRemain() {
        SchedulerProperties props = new SchedulerProperties();
        RetryEvaluator evaluator = new RetryEvaluator(props);

        Job job = new Job(
                "job-1",
                "tenant-1",
                "test",
                "idemp-1",
                JobStatus.RUNNING,
                JobPriority.NORMAL,
                "{}",
                null,
                new ExecutionPolicy("HTTP", "https://example.com", 5, null),
                Instant.now(),
                null,
                null,
                null,
                Instant.now(),
                null,
                0,
                3,
                Instant.now(),
                Instant.now()
        );

        RetryDecision decision = evaluator.evaluate(job, "boom");
        assertThat(decision.shouldRetry()).isTrue();
        assertThat(decision.nextRunAt()).isNotNull();
    }

    @Test
    void stopsAfterMaxAttempts() {
        SchedulerProperties props = new SchedulerProperties();
        RetryEvaluator evaluator = new RetryEvaluator(props);

        Job job = new Job(
                "job-2",
                "tenant-1",
                "test",
                "idemp-2",
                JobStatus.RUNNING,
                JobPriority.NORMAL,
                "{}",
                null,
                new ExecutionPolicy("HTTP", "https://example.com", 5, null),
                Instant.now(),
                null,
                null,
                null,
                Instant.now(),
                null,
                3,
                3,
                Instant.now(),
                Instant.now()
        );

        RetryDecision decision = evaluator.evaluate(job, "boom");
        assertThat(decision.shouldRetry()).isFalse();
    }

    @Test
    void capsBackoffDelay() {
        SchedulerProperties props = new SchedulerProperties();
        props.getRetry().setInitialDelaySeconds(5);
        props.getRetry().setBackoffMultiplier(2.0);
        props.getRetry().setMaxDelaySeconds(6);
        props.getRetry().setJitterPercent(0);

        RetryEvaluator evaluator = new RetryEvaluator(props);
        Instant before = Instant.now();

        Job job = new Job(
                "job-3",
                "tenant-1",
                "test",
                "idemp-3",
                JobStatus.RUNNING,
                JobPriority.NORMAL,
                "{}",
                null,
                new ExecutionPolicy("HTTP", "https://example.com", 5, null),
                Instant.now(),
                null,
                null,
                null,
                Instant.now(),
                null,
                2,
                3,
                Instant.now(),
                Instant.now()
        );

        RetryDecision decision = evaluator.evaluate(job, "boom");
        long delayMs = Duration.between(before, decision.nextRunAt()).toMillis();
        assertThat(delayMs).isBetween(5_500L, 7_000L);
    }
}


