package com.learnerview.sab.core.domain;

public enum JobStatus {
    QUEUED,
    RUNNING,
    RETRY_SCHEDULED,
    SUCCESS,
    FAILED,
    DLQ
}
