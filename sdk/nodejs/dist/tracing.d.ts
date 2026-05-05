import { SABConfig } from './config';
/**
 * Simple tracing implementation for OpenTelemetry.
 * This is a lightweight wrapper around OpenTelemetry APIs.
 */
export declare class Tracer {
    private readonly tracer;
    constructor(config: SABConfig);
    /**
     * Starts a new span.
     */
    startSpan(name: string, attributes?: Record<string, any>): Span;
}
/**
 * Span interface for tracing.
 */
export interface Span {
    setAttribute(key: string, value: any): void;
    recordException(error: Error): void;
    end(): void;
    makeCurrent(): Scope;
}
/**
 * Scope interface for span context management.
 */
export interface Scope {
    close(): void;
}
//# sourceMappingURL=tracing.d.ts.map