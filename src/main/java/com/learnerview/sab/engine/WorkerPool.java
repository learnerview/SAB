package com.learnerview.sab.engine;

import com.learnerview.sab.config.SchedulerProperties;
import com.learnerview.sab.core.domain.JobPriority;
import com.learnerview.sab.core.ports.QueueAdapter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Profile("worker")
@Slf4j
public class WorkerPool {

    private final EngineService engineService;
    private final QueueAdapter queueAdapter;
    private final SchedulerProperties props;
    private final ExecutorService executor;
    private final MeterRegistry meterRegistry;

    public WorkerPool(EngineService engineService, QueueAdapter queueAdapter, SchedulerProperties props, MeterRegistry meterRegistry) {
        this.engineService = engineService;
        this.queueAdapter = queueAdapter;
        this.props = props;
        this.meterRegistry = meterRegistry;
        // create fixed thread pool for workers
        this.executor = Executors.newFixedThreadPool(props.getWorker().getThreads());
        log.info("WorkerPool initialized with {} threads", props.getWorker().getThreads());
    }

    // submit a claim task to the worker pool for concurrent execution
    public void submitClaim(String tenant, com.learnerview.sab.core.domain.JobPriority priority, Duration leaseTtl) {
        executor.submit(() -> {
            try {
                engineService.claimAndExecute(tenant, priority, "worker", leaseTtl);
            } catch (Exception e) {
                log.error("WorkerPool claim failed for tenant {}: {}", tenant, e.getMessage(), e);
            }
        });
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down WorkerPool");
        executor.shutdownNow();
    }
}
