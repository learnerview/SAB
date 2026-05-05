# Implementation Status

This page is the source of truth for what is implemented in the repository right now.

## Implemented

### Core Job Flow

- Authenticated job submission at `POST /api/v1/jobs`
- Job lookup at `GET /api/v1/jobs/{id}`
- Job listing at `GET /api/v1/jobs`
- Job cancellation at `DELETE /api/v1/jobs/{id}`
- Supported job types at `GET /api/v1/jobs/types`
- Tenant-aware job health summary at `GET /api/v1/jobs/health`

### Security and Isolation

- API key authentication with SHA-256 hashing
- Tenant-scoped access control
- Producer and admin role separation
- Multi-tenant queue isolation
- Idempotency key enforcement at submission time
- Rate limiting for producer traffic

### Worker and Reliability

- Lease reaper for orphaned jobs
- Worker pool with configurable concurrency
- Weighted priority scheduling
- Retry handling with exponential backoff and jitter
- Circuit breaker and bulkhead protection around external HTTP execution
- DLQ handling for exhausted retries
- Recurring schedule creation, listing, cancellation, and firing

### Admin Surfaces

- Cluster stats at `GET /api/v1/admin/stats`
- Micrometer metrics summary at `GET /api/v1/admin/metrics`
- DLQ listing and retry at `GET /api/v1/admin/dlq` and `POST /api/v1/admin/dlq/{id}/retry`
- API key management at `GET /api/v1/admin/keys`, `POST /api/v1/admin/keys`, and `DELETE /api/v1/admin/keys/{id}`
- Queue cleanup at `DELETE /api/v1/admin/queues`

### Observability

- JSON structured logging
- Trace ID propagation in the request log context
- OpenTelemetry tracing with W3C propagation and OTLP export support
- Prometheus-compatible metrics endpoint
- Job counters for submitted, completed, failed, retried, DLQ, lease recovery, and schedule firing events

### Deployment

- Dockerfile for image builds
- Docker Compose for app, PostgreSQL, and Redis
- Optional monitoring profile with Prometheus and Grafana
- Flyway database migrations

## Not Yet Implemented

The following items are not currently shipped:

- Dedicated scheduler admin screens
- SDKs for Java, Node.js, or Python
- A built-in tracing UI or bundled collector stack

## Production Readiness

### Ready

- Core job submission and execution
- Tenant isolation and key management
- Retry, DLQ, and lease recovery
- Recurring schedules
- Operational monitoring and tracing export hooks
- Docker deployment path

### Needs More Work

- CI split for unit vs. integration tests
- Optional bundled tracing backend deployment
- Further documentation polish for very advanced deployments and organization-specific runbooks

## How To Read This Document

If a feature is marked implemented here, the code should support it now. If a feature is listed as not yet implemented, do not rely on it in production without adding it first.

## Last Verified

- Build: `mvn clean compile`
- Package: `mvn -q -DskipTests package`
- Result: successful
