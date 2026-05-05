"use strict";
//Queue statistics information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriorityDistribution = exports.formatQueueAge = exports.getQueueHealth = exports.getQueueFailureRate = exports.getQueueSuccessRate = exports.getTotalQueued = void 0;
//Helper function to calculate total queued jobs.
function getTotalQueued(stats) {
    return ((stats.highPriorityQueued || 0) +
        (stats.normalPriorityQueued || 0) +
        (stats.lowPriorityQueued || 0));
}
exports.getTotalQueued = getTotalQueued;
//Helper function to calculate job success rate.
function getQueueSuccessRate(stats) {
    const { success = 0, failed = 0 } = stats;
    const total = success + failed;
    if (total === 0) {
        return null;
    }
    return (success / total) * 100;
}
exports.getQueueSuccessRate = getQueueSuccessRate;
//Helper function to calculate job failure rate.
function getQueueFailureRate(stats) {
    const { success = 0, failed = 0 } = stats;
    const total = success + failed;
    if (total === 0) {
        return null;
    }
    return (failed / total) * 100;
}
exports.getQueueFailureRate = getQueueFailureRate;
//Helper function to get queue health status.
function getQueueHealth(stats) {
    const totalQueued = getTotalQueued(stats);
    const running = stats.running || 0;
    const successRate = getQueueSuccessRate(stats);
    const queueAge = stats.queueAgeMs || 0;
    // Idle state
    if (totalQueued === 0 && running === 0) {
        return 'IDLE';
    }
    // Critical conditions
    if (queueAge > 300000 || totalQueued > 1000 || (successRate !== null && successRate < 80)) {
        return 'CRITICAL';
    }
    // Warning conditions
    if (queueAge > 120000 || totalQueued > 500 || (successRate !== null && successRate < 90)) {
        return 'WARNING';
    }
    return 'HEALTHY';
}
exports.getQueueHealth = getQueueHealth;
//Helper function to format queue age.
function formatQueueAge(queueAgeMs) {
    const seconds = Math.floor(queueAgeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}
exports.formatQueueAge = formatQueueAge;
//Helper function to get priority distribution.
function getPriorityDistribution(stats) {
    const high = stats.highPriorityQueued || 0;
    const normal = stats.normalPriorityQueued || 0;
    const low = stats.lowPriorityQueued || 0;
    const total = high + normal + low;
    return {
        high,
        normal,
        low,
        percentages: {
            high: total > 0 ? (high / total) * 100 : 0,
            normal: total > 0 ? (normal / total) * 100 : 0,
            low: total > 0 ? (low / total) * 100 : 0,
        },
    };
}
exports.getPriorityDistribution = getPriorityDistribution;
//# sourceMappingURL=queue-stats.js.map