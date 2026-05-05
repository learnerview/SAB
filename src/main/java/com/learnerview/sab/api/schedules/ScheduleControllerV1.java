package com.learnerview.sab.api.schedules;

import com.learnerview.sab.core.domain.ExecutionPolicy;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.domain.JobTemplate;
import com.learnerview.sab.core.ports.SchedulerAdapter;
import com.learnerview.sab.dto.ApiResponse;
import com.learnerview.sab.dto.ScheduleRequest;
import com.learnerview.sab.dto.ScheduleResponse;
import com.learnerview.sab.mapper.ScheduleMapper;
import com.learnerview.sab.repository.ScheduleEntityRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/schedules")
@Profile("api")
@RequiredArgsConstructor
public class ScheduleControllerV1 {

    private final SchedulerAdapter schedulerAdapter;
    private final ScheduleMapper scheduleMapper;
    private final ScheduleEntityRepository scheduleRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduleResponse>> create(
            @AuthenticationPrincipal String producer,
            @Valid @RequestBody ScheduleRequest request) {
        JobTemplate template = new JobTemplate(
                request.getJobType(),
                request.getPriority() != null ? JobPriority.valueOf(request.getPriority().toUpperCase()) : JobPriority.NORMAL,
                scheduleMapper.serializePayload(request.getPayload()),
                new ExecutionPolicy(
                        request.getExecution().getType(),
                        request.getExecution().getEndpoint(),
                        request.getExecution().getTimeoutSeconds(),
                        request.getExecution().getCallbackUrl()
                ),
                request.getMaxAttempts() != null ? request.getMaxAttempts() : 3
        );
        String id = schedulerAdapter.schedule(producer, request.getCron(), template);
        return ResponseEntity.status(201).body(ApiResponse.<ScheduleResponse>builder()
                .success(true)
                .message("Schedule created")
                .data(scheduleMapper.toResponse(scheduleRepository.findById(id).orElseThrow()))
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> list(@AuthenticationPrincipal String producer) {
        List<ScheduleResponse> schedules = schedulerAdapter.list(producer).stream()
                .map(schedule -> scheduleRepository.findById(schedule.id())
                        .map(scheduleMapper::toResponse)
                        .orElseThrow())
                .toList();
        return ResponseEntity.ok(ApiResponse.<List<ScheduleResponse>>builder()
                .success(true)
                .data(schedules)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @AuthenticationPrincipal String producer,
            @PathVariable String id) {
        schedulerAdapter.cancel(id, producer);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Schedule cancelled")
                .build());
    }
}


