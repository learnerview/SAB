package com.learnerview.sab.repository;

import com.learnerview.sab.entity.ScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ScheduleEntityRepository extends JpaRepository<ScheduleEntity, String> {
    List<ScheduleEntity> findByProducerOrderByCreatedAtDesc(String producer);

    List<ScheduleEntity> findByActiveTrueAndProducerOrderByCreatedAtDesc(String producer);

    List<ScheduleEntity> findTop50ByActiveTrueAndNextRunAtLessThanEqualOrderByNextRunAtAsc(Instant now);
}


