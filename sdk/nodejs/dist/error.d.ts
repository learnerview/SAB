/**
 * Base exception class for SAB SDK errors.
 */
export declare class SABError extends Error {
    readonly errorCode?: string;
    readonly httpStatus?: number;
    readonly cause?: Error;
    constructor(message: string, errorCode?: string, httpStatus?: number, cause?: Error);
    static network(message: string, cause?: Error): SABError;
    static timeout(message: string, cause?: Error): SABError;
    static authentication(message: string, cause?: Error): SABError;
    static authorization(message: string, cause?: Error): SABError;
    static notFound(message: string, cause?: Error): SABError;
    static validation(message: string, cause?: Error): SABError;
    static rateLimit(message: string, cause?: Error): SABError;
    static server(message: string, httpStatus?: number, cause?: Error): SABError;
    static configuration(message: string, cause?: Error): SABError;
    get isNetwork(): boolean;
    get isTimeout(): boolean;
    get isAuthentication(): boolean;
    get isAuthorization(): boolean;
    get isNotFound(): boolean;
    get isValidation(): boolean;
    get isRateLimit(): boolean;
    get isServer(): boolean;
    get isConfiguration(): boolean;
    get isRetryable(): boolean;
    toString(): string;
}
//# sourceMappingURL=error.d.ts.map