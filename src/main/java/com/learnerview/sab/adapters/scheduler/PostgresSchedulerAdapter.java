package com.learnerview.sab.adapters.scheduler;

import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.JobTemplate;
import com.learnerview.sab.core.domain.Schedule;
import com.learnerview.sab.core.ports.SchedulerAdapter;
import com.learnerview.sab.entity.ScheduleEntity;
import com.learnerview.sab.mapper.ScheduleMapper;
import com.learnerview.sab.repository.ScheduleEntityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Profile("api")
@RequiredArgsConstructor
@Transactional
public class PostgresSchedulerAdapter implements SchedulerAdapter {

    private final ScheduleEntityRepository scheduleRepository;
    private final ScheduleMapper scheduleMapper;

    @Override
    public String schedule(String tenantId, String cron, JobTemplate template) {
        CronExpression expression = CronExpression.parse(cron);
        Instant nextRunAt = nextRun(expression, Instant.now());
        String id = UUID.randomUUID().toString();

        ScheduleEntity entity = ScheduleEntity.builder()
                .id(id)
                .producer(tenantId)
                .cron(cron)
                .jobType(template.jobType())
                .priority(com.learnerview.sab.model.JobPriority.valueOf(
                    (template.priority() != null ? template.priority() : JobPriority.NORMAL).name()))
                .payload(template.payload())
                .executionType(template.execution() != null ? template.execution().type() : null)
                .executionEndpoint(template.execution() != null ? template.execution().endpoint() : null)
                .timeoutSeconds(template.execution() != null ? template.execution().timeoutSeconds() : null)
                .callbackUrl(template.execution() != null ? template.execution().callbackUrl() : null)
                .maxAttempts(template.maxAttempts() > 0 ? template.maxAttempts() : 3)
                .nextRunAt(nextRunAt)
                .active(true)
                .build();
        scheduleRepository.save(entity);
        return id;
    }

    @Override
    public void cancel(String scheduleId, String tenantId) {
        ScheduleEntity entity = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId));
        if (!entity.getProducer().equals(tenantId)) {
            throw new IllegalArgumentException("Schedule does not belong to tenant: " + tenantId);
        }
        entity.setActive(false);
        scheduleRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Schedule> list(String tenantId) {
        return scheduleRepository.findByProducerOrderByCreatedAtDesc(tenantId).stream()
                .map(scheduleMapper::toDomain)
                .toList();
    }

    private Instant nextRun(CronExpression expression, Instant base) {
        ZonedDateTime next = expression.next(ZonedDateTime.ofInstant(base, ZoneOffset.UTC));
        if (next == null) {
            return base;
        }
        return next.toInstant();
    }
}
