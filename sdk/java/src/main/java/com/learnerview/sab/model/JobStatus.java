package com.learnerview.sab.model;

/**
 * Current status of a job.
 */
public enum JobStatus {
    QUEUED,
    RUNNING,
    SUCCESS,
    FAILED,
    RETRY_SCHEDULED,
    DLQ,
    CANCELLED
}
