"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizeByError = exports.isOldFailure = exports.isRecentFailure = exports.getRetrySummary = exports.formatFailureTime = exports.getTimeSinceFailure = exports.hasExhaustedRetries = void 0;
/**
 * Helper function to check if a DLQ item has exhausted retries.
 */
function hasExhaustedRetries(item) {
    const { attemptCount = 0, maxAttempts = 0 } = item;
    return attemptCount >= maxAttempts;
}
exports.hasExhaustedRetries = hasExhaustedRetries;
/**
 * Helper function to get time since failure.
 */
function getTimeSinceFailure(item) {
    if (!item.failedAt) {
        return null;
    }
    const failedAt = new Date(item.failedAt).getTime();
    return Date.now() - failedAt;
}
exports.getTimeSinceFailure = getTimeSinceFailure;
/**
 * Helper function to format failure time.
 */
function formatFailureTime(item) {
    if (!item.failedAt) {
        return 'Unknown';
    }
    const timeSince = getTimeSinceFailure(item);
    if (timeSince === null) {
        return 'Unknown';
    }
    const minutes = Math.floor(timeSince / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `${days}d ${hours % 24}h ago`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ago`;
    }
    if (minutes > 0) {
        return `${minutes}m ago`;
    }
    return 'Just now';
}
exports.formatFailureTime = formatFailureTime;
/**
 * Helper function to get retry attempt summary.
 */
function getRetrySummary(item) {
    const { attemptCount = 0, maxAttempts = 0 } = item;
    return `${attemptCount}/${maxAttempts}`;
}
exports.getRetrySummary = getRetrySummary;
/**
 * Helper function to check if DLQ item is recent.
 */
function isRecentFailure(item) {
    const timeSince = getTimeSinceFailure(item);
    return timeSince !== null && timeSince < 60 * 60 * 1000; // 1 hour
}
exports.isRecentFailure = isRecentFailure;
/**
 * Helper function to check if DLQ item is old.
 */
function isOldFailure(item) {
    const timeSince = getTimeSinceFailure(item);
    return timeSince !== null && timeSince > 24 * 60 * 60 * 1000; // 24 hours
}
exports.isOldFailure = isOldFailure;
/**
 * Helper function to categorize DLQ items by error type.
 */
function categorizeByError(items) {
    return items.reduce((categories, item) => {
        const error = item.errorMessage || 'Unknown';
        const category = getErrorCategory(error);
        let categoryItems = categories[category];
        if (!categoryItems) {
            categoryItems = [];
            categories[category] = categoryItems;
        }
        categoryItems.push(item);
        return categories;
    }, {});
}
exports.categorizeByError = categorizeByError;
/**
 * Helper function to categorize error by type.
 */
function getErrorCategory(errorMessage) {
    const message = errorMessage.toLowerCase();
    if (message.includes('timeout'))
        return 'Timeout';
    if (message.includes('connection') || message.includes('network'))
        return 'Network';
    if (message.includes('401') || message.includes('unauthorized'))
        return 'Authentication';
    if (message.includes('403') || message.includes('forbidden'))
        return 'Authorization';
    if (message.includes('404') || message.includes('not found'))
        return 'Not Found';
    if (message.includes('429') || message.includes('rate limit'))
        return 'Rate Limit';
    if (message.includes('500') || message.includes('server error'))
        return 'Server Error';
    if (message.includes('validation') || message.includes('invalid'))
        return 'Validation';
    return 'Other';
}
//# sourceMappingURL=dlq-item.js.map