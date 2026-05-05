"use strict";
//Job health information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthSummary = exports.getHealthStatus = exports.calculateFailureRate = exports.calculateSuccessRate = exports.getTotalProcessed = void 0;
//Helper function to calculate total jobs processed.
function getTotalProcessed(health) {
    return (health.success || 0) + (health.failed || 0) + (health.dlq || 0);
}
exports.getTotalProcessed = getTotalProcessed;
//Helper function to calculate success rate.
function calculateSuccessRate(health) {
    const { success = 0, failed = 0, dlq = 0 } = health;
    const total = success + failed + dlq;
    if (total === 0) {
        return null;
    }
    return (success / total) * 100;
}
exports.calculateSuccessRate = calculateSuccessRate;
//Helper function to calculate failure rate.
function calculateFailureRate(health) {
    const { success = 0, failed = 0, dlq = 0 } = health;
    const total = success + failed + dlq;
    if (total === 0) {
        return null;
    }
    return ((failed + dlq) / total) * 100;
}
exports.calculateFailureRate = calculateFailureRate;
//Helper function to get health status.
function getHealthStatus(health) {
    const totalProcessed = getTotalProcessed(health);
    const queued = health.queued || 0;
    const running = health.running || 0;
    const successRate = calculateSuccessRate(health);
    const waitTime = health.avgWaitTimeMs || 0;
    // Idle state
    if (totalProcessed === 0 && queued === 0 && running === 0) {
        return 'IDLE';
    }
    // Critical conditions
    if (waitTime > 300000 || queued > 1000 || (successRate !== null && successRate < 80)) {
        return 'CRITICAL';
    }
    // Warning conditions
    if (waitTime > 120000 || queued > 500 || (successRate !== null && successRate < 90)) {
        return 'WARNING';
    }
    return 'HEALTHY';
}
exports.getHealthStatus = getHealthStatus;
const utils_1 = require("../utils");
//Helper function to get health summary.
function getHealthSummary(health) {
    return {
        status: getHealthStatus(health),
        totalProcessed: getTotalProcessed(health),
        successRate: calculateSuccessRate(health),
        failureRate: calculateFailureRate(health),
        formattedExecutionTime: (0, utils_1.formatExecutionTime)(health.avgExecutionTimeMs || 0),
        formattedWaitTime: (0, utils_1.formatWaitTime)(health.avgWaitTimeMs || 0),
        formattedThroughput: (0, utils_1.formatThroughput)(health.throughput || 0),
    };
}
exports.getHealthSummary = getHealthSummary;
//# sourceMappingURL=job-health.js.map