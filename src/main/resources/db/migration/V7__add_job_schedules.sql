CREATE TABLE job_schedules (
    id VARCHAR(36) PRIMARY KEY,
    producer VARCHAR(120) NOT NULL,
    cron_expression VARCHAR(120) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    payload TEXT,
    execution_type VARCHAR(20),
    execution_endpoint VARCHAR(1000),
    timeout_seconds INT,
    callback_url VARCHAR(2000),
    max_attempts INT NOT NULL DEFAULT 3,
    next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_job_schedules_producer ON job_schedules (producer);
CREATE INDEX idx_job_schedules_next_run ON job_schedules (active, next_run_at);
