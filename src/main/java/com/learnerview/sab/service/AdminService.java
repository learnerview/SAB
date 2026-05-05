package com.learnerview.sab.service;

import com.learnerview.sab.dto.JobResponse;
import com.learnerview.sab.dto.QueueStatsResponse;
import com.learnerview.sab.model.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminService {

    QueueStatsResponse getStats();

    QueueStatsResponse getStats(String producer);

    Page<JobResponse> listJobs(Pageable pageable);

    Page<JobResponse> listJobsByStatus(JobStatus status, Pageable pageable);

    List<JobResponse> getRecentJobs();

    List<JobResponse> getDlqJobs();

    void retryDlqJob(String jobId);

    void clearQueues();

    java.util.Map<String, Number> getMetrics();
// API key management

    List<com.learnerview.sab.dto.ApiKeyResponse> listKeys();

    com.learnerview.sab.dto.ApiKeyResponse createKey(com.learnerview.sab.dto.ApiKeyRequest request);

    void revokeKey(String keyId);
}


