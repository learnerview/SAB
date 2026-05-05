"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUptime = exports.getSystemHealth = exports.getJobFailureRate = exports.getJobSuccessRate = void 0;
//Helper function to calculate job success rate.
function getJobSuccessRate(stats) {
    const { successfulJobs = 0, failedJobs = 0 } = stats;
    const total = successfulJobs + failedJobs;
    if (total === 0) {
        return null;
    }
    return (successfulJobs / total) * 100;
}
exports.getJobSuccessRate = getJobSuccessRate;
//Helper function to calculate job failure rate.
function getJobFailureRate(stats) {
    const { successfulJobs = 0, failedJobs = 0 } = stats;
    const total = successfulJobs + failedJobs;
    if (total === 0) {
        return null;
    }
    return (failedJobs / total) * 100;
}
exports.getJobFailureRate = getJobFailureRate;
//Helper function to get system health status.
function getSystemHealth(stats) {
    const successRate = getJobSuccessRate(stats);
    const memoryUsage = stats.memory?.usagePercentage || 0;
    const cpuUsage = stats.cpu?.usagePercentage || 0;
    // Critical conditions
    if (memoryUsage > 90 || cpuUsage > 90 || (successRate !== null && successRate < 80)) {
        return 'CRITICAL';
    }
    // Warning conditions
    if (memoryUsage > 70 || cpuUsage > 70 || (successRate !== null && successRate < 90)) {
        return 'WARNING';
    }
    return 'HEALTHY';
}
exports.getSystemHealth = getSystemHealth;
//Helper function to format uptime.
function formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}
exports.formatUptime = formatUptime;
//# sourceMappingURL=cluster-stats.js.map