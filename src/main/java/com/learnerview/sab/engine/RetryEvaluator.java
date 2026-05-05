package com.learnerview.sab.engine;

import com.learnerview.sab.config.SchedulerProperties;
import com.learnerview.sab.core.domain.Job;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class RetryEvaluator {

    private final SchedulerProperties props;

    public RetryEvaluator(SchedulerProperties props) {
        this.props = props;
    }

    public RetryDecision evaluate(Job job, String failureMessage) {
        int attempt = job.attemptCount();
        int maxAttempts = job.maxAttempts() > 0 ? job.maxAttempts() : props.getRetry().getMaxAttempts();

        if (attempt < maxAttempts) {
            long baseDelayMs = (long) (props.getRetry().getInitialDelaySeconds() * 1000L
                * Math.pow(props.getRetry().getBackoffMultiplier(), attempt));
            long cappedDelayMs = Math.min(baseDelayMs, props.getRetry().getMaxDelaySeconds() * 1000L);
            int jitterPercent = Math.max(0, props.getRetry().getJitterPercent());
            long jitterWindow = cappedDelayMs * jitterPercent / 100L;
            long jitter = jitterWindow > 0 ? ThreadLocalRandom.current().nextLong(-jitterWindow, jitterWindow + 1) : 0L;
            long delayMs = Math.max(0L, cappedDelayMs + jitter);
            Instant nextRun = Instant.now().plusMillis(delayMs);
            return new RetryDecision(true, nextRun, failureMessage);
        }

        return new RetryDecision(false, null, failureMessage);
    }
}


