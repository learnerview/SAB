"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracer = void 0;
/**
 * Simple tracing implementation for OpenTelemetry.
 * This is a lightweight wrapper around OpenTelemetry APIs.
 */
class Tracer {
    constructor(config) {
        // Initialize OpenTelemetry if enabled
        if (config.enableTracing) {
            try {
                // This is a simplified implementation
                this.tracer = {
                    startSpan: (name, attributes) => new SpanImpl(name, attributes),
                };
            }
            catch (error) {
                console.warn('Failed to initialize OpenTelemetry:', error);
                this.tracer = {
                    startSpan: () => new NoOpSpan(),
                };
            }
        }
        else {
            this.tracer = {
                startSpan: () => new NoOpSpan(),
            };
        }
    }
    /**
     * Starts a new span.
     */
    startSpan(name, attributes) {
        return this.tracer.startSpan(name, attributes);
    }
}
exports.Tracer = Tracer;
/**
 * No-op span implementation for when tracing is disabled.
 */
class NoOpSpan {
    setAttribute(key, value) {
        void key;
        void value;
    }
    recordException(error) {
        void error;
    }
    end() { }
    makeCurrent() {
        return new NoOpScope();
    }
}
/**
 * No-op scope implementation.
 */
class NoOpScope {
    close() { }
}
/**
 * Real span implementation (simplified).
 */
class SpanImpl {
    constructor(name, attributes) {
        this.name = name;
        this.attributes = {};
        this.startTime = Date.now();
        if (attributes) {
            this.attributes = { ...attributes };
        }
    }
    setAttribute(key, value) {
        this.attributes[key] = value;
    }
    recordException(error) {
        this.attributes['error'] = true;
        this.attributes['error.message'] = error.message;
        this.attributes['error.stack'] = error.stack;
    }
    end() {
        const duration = Date.now() - this.startTime;
        this.attributes['duration'] = duration;
        console.debug(`Span: ${this.name}`, this.attributes);
    }
    makeCurrent() {
        return new ScopeImpl();
    }
}
/**
 * Real scope implementation (simplified).
 */
class ScopeImpl {
    close() {
        // Restore previous span if needed
    }
}
//# sourceMappingURL=tracing.js.map