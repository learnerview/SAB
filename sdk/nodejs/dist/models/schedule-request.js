"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMonthlySchedule = exports.createWeeklySchedule = exports.createHourlySchedule = exports.createDailySchedule = exports.createWebhookScheduleRequest = exports.createScheduleRequest = void 0;
//Helper function to create a schedule request.
function createScheduleRequest(cron, jobType, priority = 'NORMAL') {
    return {
        cron,
        jobType,
        priority,
    };
}
exports.createScheduleRequest = createScheduleRequest;
//Helper function to create a webhook schedule request.
function createWebhookScheduleRequest(cron, endpoint, payload, priority = 'NORMAL', timeoutSeconds = 30) {
    return {
        cron,
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
exports.createWebhookScheduleRequest = createWebhookScheduleRequest;
//Helper function to create a daily schedule.
function createDailySchedule(jobType, hour = 0, minute = 0, priority = 'NORMAL') {
    const cron = `${minute} ${hour} * * *`;
    return createScheduleRequest(cron, jobType, priority);
}
exports.createDailySchedule = createDailySchedule;
//Helper function to create an hourly schedule.
function createHourlySchedule(jobType, minute = 0, priority = 'NORMAL') {
    const cron = `${minute} * * * *`;
    return createScheduleRequest(cron, jobType, priority);
}
exports.createHourlySchedule = createHourlySchedule;
//Helper function to create a weekly schedule.
function createWeeklySchedule(jobType, dayOfWeek, // 0 = Sunday, 6 = Saturday
hour = 0, minute = 0, priority = 'NORMAL') {
    const cron = `${minute} ${hour} * * ${dayOfWeek}`;
    return createScheduleRequest(cron, jobType, priority);
}
exports.createWeeklySchedule = createWeeklySchedule;
//Helper function to create a monthly schedule.
function createMonthlySchedule(jobType, dayOfMonth = 1, hour = 0, minute = 0, priority = 'NORMAL') {
    const cron = `${minute} ${hour} ${dayOfMonth} * *`;
    return createScheduleRequest(cron, jobType, priority);
}
exports.createMonthlySchedule = createMonthlySchedule;
//# sourceMappingURL=schedule-request.js.map