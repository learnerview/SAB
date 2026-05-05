package com.learnerview.sab.repository.projection;

import com.learnerview.sab.model.JobStatus;

public interface JobStatusCountProjection {

    JobStatus getStatus();

    Long getCount();
}