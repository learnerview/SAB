package com.learnerview.sab.core.ports;

import com.learnerview.sab.core.domain.JobTemplate;
import com.learnerview.sab.core.domain.Schedule;

import java.util.List;

public interface SchedulerAdapter {
    String schedule(String tenantId, String cron, JobTemplate template);

    void cancel(String scheduleId, String tenantId);

    List<Schedule> list(String tenantId);
}


