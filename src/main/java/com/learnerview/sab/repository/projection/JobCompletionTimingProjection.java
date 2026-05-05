package com.learnerview.sab.repository.projection;

import java.time.Instant;

public interface JobCompletionTimingProjection {

    Instant getStartedAt();

    Instant getCompletedAt();
}


