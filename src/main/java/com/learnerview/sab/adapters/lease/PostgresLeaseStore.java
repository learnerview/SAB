package com.learnerview.sab.adapters.lease;

import com.learnerview.sab.core.ports.LeaseStore;
import com.learnerview.sab.repository.JobEntityRepository;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class PostgresLeaseStore implements LeaseStore {

    private final JobEntityRepository jobRepository;

    public PostgresLeaseStore(JobEntityRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Override
    public boolean acquireLease(String jobId, String workerId, Duration ttl) {
        return jobRepository.findById(jobId).map(job -> {
            job.setLeaseOwner(workerId);
            job.setLeaseToken(UUID.randomUUID().toString());
            job.setVisibleAt(Instant.now().plus(ttl));
            jobRepository.save(job);
            return true;
        }).orElse(false);
    }

    @Override
    public void renewLease(String jobId, Duration extension) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setVisibleAt(Instant.now().plus(extension));
            jobRepository.save(job);
        });
    }

    @Override
    public void releaseLease(String jobId) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setLeaseOwner(null);
            job.setLeaseToken(null);
            job.setVisibleAt(null);
            jobRepository.save(job);
        });
    }

    @Override
    public List<String> findExpiredLeases() {
        return jobRepository
                .findTop100ByStatusAndVisibleAtBeforeOrderByVisibleAtAsc(
                        com.learnerview.sab.model.JobStatus.RUNNING, Instant.now())
                .stream()
                .map(job -> job.getId())
                .collect(Collectors.toList());
    }
}
