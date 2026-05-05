package com.learnerview.sab.service;

import com.learnerview.sab.dto.JobResponse;
import com.learnerview.sab.dto.JobSubmissionRequest;
import com.learnerview.sab.dto.JobSubmissionResponse;

public interface JobSubmissionService {

    JobSubmissionResponse submit(String producer, JobSubmissionRequest req);

    JobResponse getJob(String producer, String jobId);

    JobResponse getJob(String jobId);

    void cancelJob(String producer, String jobId);

    org.springframework.data.domain.Page<JobResponse> listJobs(String producer, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<JobResponse> listJobs(org.springframework.data.domain.Pageable pageable);
}
