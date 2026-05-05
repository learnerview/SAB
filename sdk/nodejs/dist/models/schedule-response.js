"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNextExecutionWithin = exports.getTimeUntilNextExecution = exports.getNextExecutionTime = exports.isScheduleActive = void 0;
//Helper function to check if a schedule is active.
function isScheduleActive(schedule) {
    return schedule.active === true;
}
exports.isScheduleActive = isScheduleActive;
//Helper function to get next execution time as Date object.
function getNextExecutionTime(schedule) {
    if (!schedule.nextRunAt) {
        return null;
    }
    return new Date(schedule.nextRunAt);
}
exports.getNextExecutionTime = getNextExecutionTime;
//Helper function to get time until next execution in milliseconds.
function getTimeUntilNextExecution(schedule) {
    const nextTime = getNextExecutionTime(schedule);
    if (!nextTime) {
        return null;
    }
    return nextTime.getTime() - Date.now();
}
exports.getTimeUntilNextExecution = getTimeUntilNextExecution;
//Helper function to check if next execution is within a time window.
function isNextExecutionWithin(schedule, windowMs) {
    const timeUntil = getTimeUntilNextExecution(schedule);
    if (timeUntil === null || timeUntil < 0) {
        return false;
    }
    return timeUntil <= windowMs;
}
exports.isNextExecutionWithin = isNextExecutionWithin;
//# sourceMappingURL=schedule-response.js.map