"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobWaitTime = exports.getJobDuration = exports.isJobRetrying = exports.isJobQueued = exports.isJobFailed = exports.isJobSuccessful = exports.isJobRunning = void 0;
//Helper function to check if a job is running.
function isJobRunning(job) {
    return job.status === 'RUNNING';
}
exports.isJobRunning = isJobRunning;
//Helper function to check if a job is completed successfully.
function isJobSuccessful(job) {
    return job.status === 'SUCCESS';
}
exports.isJobSuccessful = isJobSuccessful;
//Helper function to check if a job failed.
function isJobFailed(job) {
    return job.status === 'FAILED' || job.status === 'DLQ';
}
exports.isJobFailed = isJobFailed;
//Helper function to check if a job is queued.
function isJobQueued(job) {
    return job.status === 'QUEUED';
}
exports.isJobQueued = isJobQueued;
//Helper function to check if a job is retrying.
function isJobRetrying(job) {
    return job.status === 'RETRY_SCHEDULED';
}
exports.isJobRetrying = isJobRetrying;
//Helper function to get job duration in milliseconds.
function getJobDuration(job) {
    if (!job.startedAt || !job.completedAt) {
        return null;
    }
    const start = new Date(job.startedAt).getTime();
    const end = new Date(job.completedAt).getTime();
    return end - start;
}
exports.getJobDuration = getJobDuration;
//Helper function to get job wait time in milliseconds.
function getJobWaitTime(job) {
    if (!job.createdAt || !job.startedAt) {
        return null;
    }
    const created = new Date(job.createdAt).getTime();
    const started = new Date(job.startedAt).getTime();
    return started - created;
}
exports.getJobWaitTime = getJobWaitTime;
//# sourceMappingURL=job-response.js.map