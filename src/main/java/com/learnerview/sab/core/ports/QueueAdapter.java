package com.learnerview.sab.core.ports;

import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.QueueStats;

import java.util.Optional;

public interface QueueAdapter {
    void enqueue(Job job);

    Optional<Job> dequeue(String tenantId, JobPriority priority);

    void acknowledge(String jobId);

    void nack(String jobId, String reason);

    QueueStats stats(String tenantId);

    java.util.List<String> listTenantIdsWithJobs();
}


