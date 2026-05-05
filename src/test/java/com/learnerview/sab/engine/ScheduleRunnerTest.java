package com.learnerview.sab.engine;

import com.learnerview.sab.entity.ScheduleEntity;
import com.learnerview.sab.model.JobPriority;
import com.learnerview.sab.repository.ScheduleEntityRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ScheduleRunnerTest {

    @Test
    void runsDueScheduleAndReschedulesNextFire() {
        ScheduleEntityRepository scheduleRepository = mock(ScheduleEntityRepository.class);
        EngineService engineService = mock(EngineService.class);
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        ScheduleRunner runner = new ScheduleRunner(scheduleRepository, engineService, meterRegistry);

        ScheduleEntity schedule = ScheduleEntity.builder()
                .id("schedule-1")
                .producer("tenant-1")
                .cron("5 * * * * *")
                .jobType("nightly-report")
                .priority(JobPriority.NORMAL)
                .payload("{\"reportType\":\"daily\"}")
                .executionType("HTTP")
                .executionEndpoint("https://example.com/run")
                .timeoutSeconds(10)
                .callbackUrl(null)
                .maxAttempts(3)
                .nextRunAt(Instant.now().minusSeconds(10))
                .active(true)
                .build();

        when(scheduleRepository.findTop50ByActiveTrueAndNextRunAtLessThanEqualOrderByNextRunAtAsc(any())).thenReturn(List.of(schedule));

        runner.runDueSchedules();

        verify(engineService).submit(any());
        ArgumentCaptor<ScheduleEntity> captor = ArgumentCaptor.forClass(ScheduleEntity.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().isActive()).isTrue();
        assertThat(captor.getValue().getNextRunAt().compareTo(schedule.getNextRunAt()) >= 0).isTrue();
        assertThat(meterRegistry.counter("sab.schedules.fired", "tenant_id", "tenant-1").count()).isEqualTo(1.0);
    }
}


