import { ApiResponse } from './common';
//Generic API response wrapper.

export { ApiResponse };
//Helper function to check if response is successful.

export function isResponseSuccess<T>(response: ApiResponse<T>): boolean {
  return response.success === true;
}
//Helper function to check if response has data.

export function hasResponseData<T>(response: ApiResponse<T>): boolean {
  return response.data !== undefined && response.data !== null;
}
//Helper function to extract data from response.

export function getResponseData<T>(response: ApiResponse<T>): T | undefined {
  return response.data;
}
//Helper function to extract error information from response.

export function getResponseError<T>(response: ApiResponse<T>): {
  message?: string;
  errorCode?: string;
} {
  return {
    message: response.message,
    errorCode: response.errorCode,
  };
}
//Helper function to create a successful response.

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: Date.now(),
  };
}
//Helper function to create an error response.

export function createErrorResponse(message: string, errorCode?: string, data?: any): ApiResponse {
  return {
    success: false,
    message,
    errorCode,
    data,
    timestamp: Date.now(),
  };
}
