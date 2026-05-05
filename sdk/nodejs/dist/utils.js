"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatThroughput = exports.formatWaitTime = exports.formatExecutionTime = exports.formatDuration = void 0;
/**
 * Helper function to format time duration in a human-readable string.
 * @param timeMs time in milliseconds
 * @returns formatted string
 */
function formatDuration(timeMs) {
    if (timeMs < 1000) {
        return `${Math.round(timeMs)}ms`;
    }
    const seconds = timeMs / 1000;
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }
    const minutes = seconds / 60;
    if (minutes < 60) {
        return `${minutes.toFixed(1)}m`;
    }
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
}
exports.formatDuration = formatDuration;
/**
 * Alias for formatDuration to match previous API.
 */
exports.formatExecutionTime = formatDuration;
exports.formatWaitTime = formatDuration;
/**
 * Helper function to format throughput.
 */
function formatThroughput(throughput) {
    if (throughput < 1) {
        return `${(throughput * 60).toFixed(1)}/min`;
    }
    if (throughput < 60) {
        return `${throughput.toFixed(1)}/s`;
    }
    const perMinute = throughput / 60;
    if (perMinute < 60) {
        return `${perMinute.toFixed(1)}/min`;
    }
    const perHour = perMinute / 60;
    return `${perHour.toFixed(1)}/h`;
}
exports.formatThroughput = formatThroughput;
//# sourceMappingURL=utils.js.map