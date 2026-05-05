package com.learnerview.sab.service;

import com.learnerview.sab.entity.JobEntity;

public interface RetryService {

    void handleFailure(JobEntity job, String errorMessage, long durationMs);

    void logSuccess(JobEntity job, String message, long durationMs);
}


