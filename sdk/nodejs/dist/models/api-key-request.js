"use strict";
//Request object for creating an API key.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminApiKeyRequest = exports.createTenantApiKeyRequest = exports.createApiKeyRequest = void 0;
//Helper function to create an API key request.
function createApiKeyRequest(label, producer, isAdmin = false) {
    return {
        label,
        producer,
        isAdmin,
    };
}
exports.createApiKeyRequest = createApiKeyRequest;
//Helper function to create a tenant API key request.
function createTenantApiKeyRequest(label, producer) {
    return createApiKeyRequest(label, producer, false);
}
exports.createTenantApiKeyRequest = createTenantApiKeyRequest;
//Helper function to create an admin API key request.
function createAdminApiKeyRequest(label, producer) {
    return createApiKeyRequest(label, producer, true);
}
exports.createAdminApiKeyRequest = createAdminApiKeyRequest;
//# sourceMappingURL=api-key-request.js.map