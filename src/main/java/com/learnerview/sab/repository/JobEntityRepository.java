package com.learnerview.sab.repository;

import com.learnerview.sab.entity.JobEntity;
import com.learnerview.sab.model.JobStatus;
import com.learnerview.sab.repository.projection.JobCompletionTimingProjection;
import com.learnerview.sab.repository.projection.JobStatusCountProjection;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobEntityRepository extends JpaRepository<JobEntity, String> {
    Page<JobEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<JobEntity> findByStatusOrderByCreatedAtDesc(JobStatus status, Pageable pageable);
    Page<JobEntity> findByJobTypeOrderByCreatedAtDesc(String jobType, Pageable pageable);
    Page<JobEntity> findByProducerOrderByCreatedAtDesc(String producer, Pageable pageable);
    List<JobEntity> findByStatus(JobStatus status);
    List<JobEntity> findTop100ByStatusAndVisibleAtBeforeOrderByVisibleAtAsc(JobStatus status, Instant before);
    List<JobEntity> findTop100ByStatusAndNextRunAtLessThanEqualOrderByNextRunAtAsc(JobStatus status, Instant now);
    long countByStatus(JobStatus status);
    long countByProducerAndStatus(String producer, JobStatus status);
    List<JobEntity> findTop20ByOrderByCreatedAtDesc();
    List<JobEntity> findTop20ByProducerOrderByCreatedAtDesc(String producer);
    Optional<JobEntity> findByProducerAndIdempotencyKey(String producer, String idempotencyKey);
    Optional<JobEntity> findByProducerAndId(String producer, String id);

    @Query("SELECT j.status AS status, COUNT(j) AS count FROM JobEntity j GROUP BY j.status")
    List<JobStatusCountProjection> countByStatusGrouped();

    @Query("SELECT j.status AS status, COUNT(j) AS count FROM JobEntity j WHERE j.producer = :producer GROUP BY j.status")
    List<JobStatusCountProjection> countByProducerAndStatusGrouped(@Param("producer") String producer);

    @Modifying
    @Transactional
    @Query("UPDATE JobEntity j SET j.status = :runningStatus, j.leaseToken = :leaseToken, " +
           "j.leaseOwner = :leaseOwner, j.visibleAt = :visibleUntil, j.startedAt = :now, j.updatedAt = :now " +
           "WHERE j.id = :jobId AND j.producer = :producer AND j.status = :queuedStatus AND j.nextRunAt <= :now")
    int claimForExecution(@Param("jobId") String jobId,
                          @Param("producer") String producer,
                          @Param("leaseToken") String leaseToken,
                          @Param("leaseOwner") String leaseOwner,
                          @Param("visibleUntil") Instant visibleUntil,
                          @Param("now") Instant now,
                          @Param("queuedStatus") JobStatus queuedStatus,
                          @Param("runningStatus") JobStatus runningStatus);

    List<JobEntity> findTop100ByProducerAndStatusOrderByCreatedAtDesc(String producer, JobStatus status);

    // Throughput: successful completions since a given instant
    long countByStatusAndCompletedAtAfter(JobStatus status, Instant since);

    // Retry rate: jobs with at least one retry among terminal states
    long countByAttemptCountGreaterThanAndStatusIn(int minAttempts, List<JobStatus> statuses);

    // Latency: fetch recently completed jobs so service can average startedAt→completedAt
    @Query("SELECT j.startedAt AS startedAt, j.completedAt AS completedAt FROM JobEntity j WHERE j.status = :status " +
           "AND j.startedAt IS NOT NULL AND j.completedAt IS NOT NULL " +
           "AND j.completedAt > :since")
    List<JobCompletionTimingProjection> findCompletedWithTimingsSince(@Param("status") JobStatus status,
                                                                      @Param("since") Instant since);
}
