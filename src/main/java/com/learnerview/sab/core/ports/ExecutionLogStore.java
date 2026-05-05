package com.learnerview.sab.core.ports;

public interface ExecutionLogStore {
    void logSuccess(String jobId, int attempt, String message, long durationMs);

    void logFailure(String jobId, int attempt, String message, long durationMs);
}


