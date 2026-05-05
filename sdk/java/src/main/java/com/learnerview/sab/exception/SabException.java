package com.learnerview.sab.exception;

/**
 * Base exception class for SAB SDK errors.
 */
public class SabException extends RuntimeException {
    private final String errorCode;
    private final int httpStatus;

    public SabException(String message) {
        super(message);
        this.errorCode = null;
        this.httpStatus = -1;
    }

    public SabException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = null;
        this.httpStatus = -1;
    }

    public SabException(String message, String errorCode, int httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public SabException(String message, String errorCode, int httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder(super.toString());
        if (errorCode != null) {
            sb.append(" [errorCode=").append(errorCode).append("]");
        }
        if (httpStatus > 0) {
            sb.append(" [httpStatus=").append(httpStatus).append("]");
        }
        return sb.toString();
    }
}
