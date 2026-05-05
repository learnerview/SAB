// Job execution log repository for SAB job scheduling platform
// This Spring Data JPA repository provides database access methods for job
// execution log entities. It maintains audit trails and execution history
// for all jobs processed through the SAB system.
//
// Key features:
// - Execution history tracking for each job
// - Attempt-level logging for retry scenarios
// - Chronological ordering of execution attempts
// - Comprehensive audit trail for debugging
// - Performance monitoring and analytics support
package com.learnerview.sab.repository;

// Entity import
import com.learnerview.sab.entity.JobExecutionLog;
// Spring Data JPA imports
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Utility imports
import java.util.List;

// Spring Data JPA repository for JobExecutionLog operations
// This repository manages the execution history of jobs, storing detailed
// logs for each attempt including timestamps, results, and error information.
// The logs are crucial for debugging, auditing, and performance analysis.
@Repository
public interface JobExecutionLogRepository extends JpaRepository<JobExecutionLog, Long> {
    
    // Find all execution logs for a specific job ordered by attempt number
    // This method retrieves the complete execution history for a job,
    // ordered chronologically by attempt sequence to show the progression
    // of retries and final outcome.
    // @param jobId the unique identifier of the job
    // @return list of execution logs ordered by attempt number ascending
    List<JobExecutionLog> findByJobIdOrderByAttemptAsc(String jobId);
}


