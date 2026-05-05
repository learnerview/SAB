package com.learnerview.sab.adapters.state;

import com.learnerview.sab.core.ports.ExecutionLogStore;
import com.learnerview.sab.entity.JobExecutionLog;
import com.learnerview.sab.repository.JobExecutionLogRepository;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresExecutionLogStore implements ExecutionLogStore {

    private final JobExecutionLogRepository logRepository;

    public PostgresExecutionLogStore(JobExecutionLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Override
    public void logSuccess(String jobId, int attempt, String message, long durationMs) {
        logRepository.save(JobExecutionLog.builder()
                .jobId(jobId)
                .attempt(attempt)
                .status("SUCCESS")
                .message(message)
                .durationMs(durationMs)
                .build());
    }

    @Override
    public void logFailure(String jobId, int attempt, String message, long durationMs) {
        logRepository.save(JobExecutionLog.builder()
                .jobId(jobId)
                .attempt(attempt)
                .status("FAILED")
                .message(message)
                .durationMs(durationMs)
                .build());
    }
}


