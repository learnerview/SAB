import { ApiResponse } from './common';
export { ApiResponse };
export declare function isResponseSuccess<T>(response: ApiResponse<T>): boolean;
export declare function hasResponseData<T>(response: ApiResponse<T>): boolean;
export declare function getResponseData<T>(response: ApiResponse<T>): T | undefined;
export declare function getResponseError<T>(response: ApiResponse<T>): {
    message?: string;
    errorCode?: string;
};
export declare function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T>;
export declare function createErrorResponse(message: string, errorCode?: string, data?: any): ApiResponse;
//# sourceMappingURL=api-response.d.ts.map