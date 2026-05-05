package com.learnerview.sab.core.ports;

import java.time.Duration;
import java.util.List;

public interface LeaseStore {
    boolean acquireLease(String jobId, String workerId, Duration ttl);

    void renewLease(String jobId, Duration extension);

    void releaseLease(String jobId);

    List<String> findExpiredLeases();
}


