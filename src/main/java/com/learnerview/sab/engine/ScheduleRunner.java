package com.learnerview.sab.engine;

import com.learnerview.sab.core.domain.Job;
import com.learnerview.sab.core.domain.JobStatus;
import com.learnerview.sab.entity.ScheduleEntity;
import com.learnerview.sab.repository.ScheduleEntityRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
@Profile("worker")
@RequiredArgsConstructor
@Slf4j
public class ScheduleRunner {

    private final ScheduleEntityRepository scheduleRepository;
    private final EngineService engineService;
    private final MeterRegistry meterRegistry;

    @Scheduled(fixedDelayString = "${sab.scheduler.polling-interval-ms:1000}")
    @Transactional
    @Observed(name = "sab.schedule.run", contextualName = "schedule run")
    public void runDueSchedules() {
        Instant now = Instant.now();
        for (ScheduleEntity schedule : scheduleRepository.findTop50ByActiveTrueAndNextRunAtLessThanEqualOrderByNextRunAtAsc(now)) {
            try {
                fireSchedule(schedule, now);
            } catch (Exception e) {
                log.error("Failed to run schedule {} tenant={}: {}", schedule.getId(), schedule.getProducer(), e.getMessage(), e);
            }
        }
    }

    private void fireSchedule(ScheduleEntity schedule, Instant now) {
        CronExpression cron = CronExpression.parse(schedule.getCron());
        ZonedDateTime next = cron.next(ZonedDateTime.ofInstant(schedule.getNextRunAt().plusSeconds(1), ZoneOffset.UTC));

        Job job = new Job(
                UUID.randomUUID().toString(),
                schedule.getProducer(),
                schedule.getJobType(),
                schedule.getId() + ":" + schedule.getNextRunAt().toEpochMilli(),
                JobStatus.QUEUED,
                com.learnerview.sab.core.domain.JobPriority.valueOf(schedule.getPriority().name()),
                schedule.getPayload(),
                null,
                new com.learnerview.sab.core.domain.ExecutionPolicy(
                        schedule.getExecutionType(),
                        schedule.getExecutionEndpoint(),
                        schedule.getTimeoutSeconds(),
                        schedule.getCallbackUrl()
                ),
                schedule.getNextRunAt(),
                null,
                null,
                null,
                null,
                null,
                0,
                schedule.getMaxAttempts(),
                now,
                now
        );

        engineService.submit(job);
        meterRegistry.counter("sab.schedules.fired", "tenant_id", schedule.getProducer()).increment();

        if (next == null) {
            schedule.setActive(false);
        } else {
            schedule.setNextRunAt(next.toInstant());
        }
        scheduleRepository.save(schedule);
    }
}


