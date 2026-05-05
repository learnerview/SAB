/**
 * Base exception class for SAB SDK errors.
 */
export class SABError extends Error {
  public readonly errorCode?: string;
  public readonly httpStatus?: number;
  public readonly cause?: Error;

  constructor(message: string, errorCode?: string, httpStatus?: number, cause?: Error) {
    super(message);
    this.name = 'SABError';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SABError);
    }
  }

  static network(message: string, cause?: Error): SABError {
    return new SABError(message, 'NETWORK_ERROR', 0, cause);
  }

  static timeout(message: string, cause?: Error): SABError {
    return new SABError(message, 'TIMEOUT_ERROR', 408, cause);
  }

  static authentication(message: string, cause?: Error): SABError {
    return new SABError(message, 'AUTHENTICATION_ERROR', 401, cause);
  }

  static authorization(message: string, cause?: Error): SABError {
    return new SABError(message, 'AUTHORIZATION_ERROR', 403, cause);
  }

  static notFound(message: string, cause?: Error): SABError {
    return new SABError(message, 'NOT_FOUND', 404, cause);
  }

  static validation(message: string, cause?: Error): SABError {
    return new SABError(message, 'VALIDATION_ERROR', 400, cause);
  }

  static rateLimit(message: string, cause?: Error): SABError {
    return new SABError(message, 'RATE_LIMIT_ERROR', 429, cause);
  }

  static server(message: string, httpStatus: number = 500, cause?: Error): SABError {
    return new SABError(message, 'SERVER_ERROR', httpStatus, cause);
  }

  static configuration(message: string, cause?: Error): SABError {
    return new SABError(message, 'CONFIGURATION_ERROR', 0, cause);
  }

  get isNetwork(): boolean {
    return this.errorCode === 'NETWORK_ERROR';
  }

  get isTimeout(): boolean {
    return this.errorCode === 'TIMEOUT_ERROR';
  }

  get isAuthentication(): boolean {
    return this.errorCode === 'AUTHENTICATION_ERROR';
  }

  get isAuthorization(): boolean {
    return this.errorCode === 'AUTHORIZATION_ERROR';
  }

  get isNotFound(): boolean {
    return this.errorCode === 'NOT_FOUND';
  }

  get isValidation(): boolean {
    return this.errorCode === 'VALIDATION_ERROR';
  }

  get isRateLimit(): boolean {
    return this.errorCode === 'RATE_LIMIT_ERROR';
  }

  get isServer(): boolean {
    return this.errorCode === 'SERVER_ERROR';
  }

  get isConfiguration(): boolean {
    return this.errorCode === 'CONFIGURATION_ERROR';
  }

  get isRetryable(): boolean {
    return !!(
      this.isNetwork ||
      this.isTimeout ||
      this.isRateLimit ||
      (this.isServer && this.httpStatus && this.httpStatus >= 500)
    );
  }

  public override toString(): string {
    let result = `${this.name}: ${this.message}`;

    if (this.errorCode) {
      result += ` [errorCode=${this.errorCode}]`;
    }

    if (this.httpStatus) {
      result += ` [httpStatus=${this.httpStatus}]`;
    }

    if (this.cause) {
      result += ` [cause=${this.cause.message}]`;
    }

    return result;
  }
}
