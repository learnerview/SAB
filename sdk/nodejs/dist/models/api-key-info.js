"use strict";
//API key information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeyStatus = exports.isStaleKey = exports.isRecentlyUsed = exports.formatLastUsed = exports.formatKeyAge = exports.getTimeSinceLastUse = exports.getKeyAge = exports.isKeyActive = exports.isAdminKey = void 0;
//Helper function to check if API key is admin.
function isAdminKey(keyInfo) {
    return keyInfo.isAdmin === true;
}
exports.isAdminKey = isAdminKey;
//Helper function to check if API key is active.
function isKeyActive(keyInfo) {
    return keyInfo.active !== false; // Default to active if not specified
}
exports.isKeyActive = isKeyActive;
//Helper function to get key age in milliseconds.
function getKeyAge(keyInfo) {
    if (!keyInfo.createdAt) {
        return null;
    }
    const createdAt = new Date(keyInfo.createdAt).getTime();
    return Date.now() - createdAt;
}
exports.getKeyAge = getKeyAge;
//Helper function to get time since last use in milliseconds.
function getTimeSinceLastUse(keyInfo) {
    if (!keyInfo.lastUsedAt) {
        return null;
    }
    const lastUsedAt = new Date(keyInfo.lastUsedAt).getTime();
    return Date.now() - lastUsedAt;
}
exports.getTimeSinceLastUse = getTimeSinceLastUse;
//Helper function to format key age.
function formatKeyAge(keyInfo) {
    const age = getKeyAge(keyInfo);
    if (age === null) {
        return 'Unknown';
    }
    const minutes = Math.floor(age / (1000 * 60));
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
exports.formatKeyAge = formatKeyAge;
//Helper function to format last used time.
function formatLastUsed(keyInfo) {
    const timeSince = getTimeSinceLastUse(keyInfo);
    if (timeSince === null) {
        return 'Never';
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
exports.formatLastUsed = formatLastUsed;
//Helper function to check if key is recently used (within last hour).
function isRecentlyUsed(keyInfo) {
    const timeSince = getTimeSinceLastUse(keyInfo);
    return timeSince !== null && timeSince < 60 * 60 * 1000; // 1 hour
}
exports.isRecentlyUsed = isRecentlyUsed;
//Helper function to check if key is stale (not used in last 30 days).
function isStaleKey(keyInfo) {
    const timeSince = getTimeSinceLastUse(keyInfo);
    return timeSince !== null && timeSince > 30 * 24 * 60 * 60 * 1000; // 30 days
}
exports.isStaleKey = isStaleKey;
//Helper function to get key status summary.
function getKeyStatus(keyInfo) {
    return {
        active: isKeyActive(keyInfo),
        admin: isAdminKey(keyInfo),
        recentlyUsed: isRecentlyUsed(keyInfo),
        stale: isStaleKey(keyInfo),
        age: formatKeyAge(keyInfo),
        lastUsed: formatLastUsed(keyInfo),
    };
}
exports.getKeyStatus = getKeyStatus;
//# sourceMappingURL=api-key-info.js.map