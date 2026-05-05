package com.learnerview.sab.core.domain;

public record QueueStats(
        long highQueueSize,
        long normalQueueSize,
        long lowQueueSize,
        long totalQueued,
        long totalRunning,
        long totalSuccess,
        long totalFailed,
        long totalDlq
) {
}


