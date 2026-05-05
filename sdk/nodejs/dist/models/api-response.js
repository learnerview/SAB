"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.createSuccessResponse = exports.getResponseError = exports.getResponseData = exports.hasResponseData = exports.isResponseSuccess = void 0;
//Helper function to check if response is successful.
function isResponseSuccess(response) {
    return response.success === true;
}
exports.isResponseSuccess = isResponseSuccess;
//Helper function to check if response has data.
function hasResponseData(response) {
    return response.data !== undefined && response.data !== null;
}
exports.hasResponseData = hasResponseData;
//Helper function to extract data from response.
function getResponseData(response) {
    return response.data;
}
exports.getResponseData = getResponseData;
//Helper function to extract error information from response.
function getResponseError(response) {
    return {
        message: response.message,
        errorCode: response.errorCode,
    };
}
exports.getResponseError = getResponseError;
//Helper function to create a successful response.
function createSuccessResponse(data, message) {
    return {
        success: true,
        message,
        data,
        timestamp: Date.now(),
    };
}
exports.createSuccessResponse = createSuccessResponse;
//Helper function to create an error response.
function createErrorResponse(message, errorCode, data) {
    return {
        success: false,
        message,
        errorCode,
        data,
        timestamp: Date.now(),
    };
}
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=api-response.js.map