"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobWithRetry = exports.createWebhookJobRequest = exports.createJobSubmissionRequest = void 0;
//Helper function to create a job submission request.
function createJobSubmissionRequest(jobType, priority = 'NORMAL') {
    return {
        jobType,
        priority,
    };
}
exports.createJobSubmissionRequest = createJobSubmissionRequest;
//Helper function to create a webhook job submission request.
function createWebhookJobRequest(endpoint, payload, priority = 'NORMAL', timeoutSeconds = 30) {
    return {
        jobType: 'webhook',
        priority,
        payload,
        execution: {
            type: 'HTTP',
            endpoint,
            timeoutSeconds,
        },
    };
}
exports.createWebhookJobRequest = createWebhookJobRequest;
//Helper function to create a job with retry policy.
function createJobWithRetry(jobType, priority, maxAttempts, retryPolicy) {
    return {
        jobType,
        priority,
        maxAttempts,
        execution: {
            type: 'HTTP',
            endpoint: '',
            retryPolicy,
        },
    };
}
exports.createJobWithRetry = createJobWithRetry;
//# sourceMappingURL=job-submission-request.js.map