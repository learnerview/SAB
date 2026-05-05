# API Documentation

This is the primary reference for SAB HTTP APIs, including endpoint definitions, request/response contracts, and practical examples.

## Base URL

```text
http://localhost:8080
```

Replace with your deployment URL in staging and production.

## Authentication

Most endpoints require an API key.

```text
X-API-KEY: <your-api-key>
```

Key roles:

- Producer key: tenant-scoped job and schedule operations.
- Admin key: cluster-wide admin operations.
- Public access: limited to selected endpoints such as health and job types.

## Response Model

Most endpoints return an `ApiResponse<T>` envelope:

```json
{
	"success": true,
	"message": "Job queued",
	"data": {
		"jobId": "job-123",
		"status": "QUEUED"
	}
}
```

Typical status codes:

- `200 OK`: read or successful mutation.
- `201 Created`: resource created.
- `202 Accepted`: async work accepted.
- `400 Bad Request`: validation or malformed input.
- `401 Unauthorized`: missing or invalid API key.
- `403 Forbidden`: valid key without required permission.
- `404 Not Found`: resource not found.
- `409 Conflict`: conflicting operation (for example, duplicate idempotency key).
- `5xx`: server or dependency failure.

## Endpoint Summary

| Area | Method | Path | Auth | Purpose |
|------|--------|------|------|---------|
| Jobs | `POST` | `/api/v1/jobs` | Producer/Admin | Submit one asynchronous job |
| Jobs | `GET` | `/api/v1/jobs/{id}` | Producer/Admin | Get one job by ID |
| Jobs | `GET` | `/api/v1/jobs?page=0&size=20` | Producer/Admin | List jobs with pagination |
| Jobs | `DELETE` | `/api/v1/jobs/{id}` | Producer/Admin | Cancel a queued job |
| Jobs | `GET` | `/api/v1/jobs/types` | Public | List supported job handlers |
| Jobs | `GET` | `/api/v1/jobs/health` | Producer/Admin | Tenant-aware queue health summary |
| Schedules | `POST` | `/api/v1/schedules` | Producer/Admin | Create recurring schedule |
| Schedules | `GET` | `/api/v1/schedules` | Producer/Admin | List schedules |
| Schedules | `DELETE` | `/api/v1/schedules/{id}` | Producer/Admin | Disable schedule |
| Admin | `GET` | `/api/v1/admin/stats` | Admin | Cluster operational summary |
| Admin | `GET` | `/api/v1/admin/metrics` | Admin | Metrics counters for operations |
| Admin | `GET` | `/api/v1/admin/dlq` | Admin | List DLQ jobs |
| Admin | `POST` | `/api/v1/admin/dlq/{id}/retry` | Admin | Retry one DLQ job |
| Admin | `DELETE` | `/api/v1/admin/queues` | Admin | Clear queue backend |
| Admin | `GET` | `/api/v1/admin/keys` | Admin | List API keys |
| Admin | `POST` | `/api/v1/admin/keys` | Admin | Create API key |
| Admin | `DELETE` | `/api/v1/admin/keys/{id}` | Admin | Revoke API key |
| Events | `GET` | `/api/v1/events` | Producer/Admin | Server-sent event stream |

## Jobs API

### `POST /api/v1/jobs`

Creates one async job.

Request body definition:

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `jobType` | `string` | Yes | Logical job label, such as `webhook` or `invoice-sync` |
| `idempotencyKey` | `string` | Yes | Stable key for deduplication per business event |
| `priority` | `string` | No | `HIGH`, `NORMAL`, `LOW` |
| `payload` | `object` | Yes | Arbitrary JSON payload |
| `execution.type` | `string` | Yes | Execution mode, currently `HTTP` |
| `execution.endpoint` | `string` | Yes | Target endpoint invoked by worker |
| `maxAttempts` | `number` | No | Max retries before DLQ |
| `timeoutSeconds` | `number` | No | Request timeout sent to worker |
| `callbackUrl` | `string` | No | Optional callback metadata |

Example:

```bash
curl -X POST http://localhost:8080/api/v1/jobs \
	-H "X-API-KEY: <producer-key>" \
	-H "Content-Type: application/json" \
	-d '{
		"jobType": "webhook",
		"idempotencyKey": "invoice-2026-000123",
		"priority": "HIGH",
		"payload": {
			"invoiceId": "inv_1024",
			"customerId": "cus_778"
		},
		"execution": {
			"type": "HTTP",
			"endpoint": "https://example.com/hooks/invoice"
		},
		"maxAttempts": 5,
		"timeoutSeconds": 20
	}'
```

### `GET /api/v1/jobs/{id}`

Returns one job state object by ID.

### `GET /api/v1/jobs?page=0&size=20`

Returns paginated jobs. Use `page` and `size` query parameters.

### `DELETE /api/v1/jobs/{id}`

Cancels one queued job. Running or completed jobs may not be cancelable.

### `GET /api/v1/jobs/types`

Returns public handler metadata used by clients and UI to show available job types.

### `GET /api/v1/jobs/health`

Returns queue depth, throughput, retry rate, and latency summary.

## Schedules API

### `POST /api/v1/schedules`

Creates a recurring schedule that produces jobs from a Spring cron expression.

Example:

```bash
curl -X POST http://localhost:8080/api/v1/schedules \
	-H "X-API-KEY: <producer-key>" \
	-H "Content-Type: application/json" \
	-d '{
		"cron": "0 */15 * * * *",
		"jobType": "catalog-sync",
		"priority": "NORMAL",
		"payload": {"scope": "full"},
		"execution": {
			"type": "HTTP",
			"endpoint": "https://example.com/internal/catalog/sync"
		},
		"maxAttempts": 3
	}'
```

Cron notes:

- Spring cron includes seconds.
- `0 */15 * * * *` means every 15 minutes.

### `GET /api/v1/schedules`

Returns all schedules for the authenticated tenant.

### `DELETE /api/v1/schedules/{id}`

Disables a schedule so no new jobs are emitted.

## Admin API

All admin endpoints require an admin key.

### `GET /api/v1/admin/stats`

Cluster-level queue and processing summary.

### `GET /api/v1/admin/metrics`

Micrometer counters for dashboard and alerting pipelines.

Example metric names:

- `sab.jobs.submitted`
- `sab.jobs.completed`
- `sab.jobs.failed`
- `sab.jobs.retried`
- `sab.jobs.dlq`
- `sab.lease.reaper.recovered`
- `sab.schedules.fired`

### `GET /api/v1/admin/dlq`

Lists DLQ jobs that exhausted retry attempts.

### `POST /api/v1/admin/dlq/{id}/retry`

Retries one DLQ job after root cause is fixed.

### `DELETE /api/v1/admin/queues`

Clears queue backend state. Use only during controlled maintenance windows.

### API Key Management

- `GET /api/v1/admin/keys`
- `POST /api/v1/admin/keys`
- `DELETE /api/v1/admin/keys/{id}`

Create-key example:

```bash
curl -X POST http://localhost:8080/api/v1/admin/keys \
	-H "X-API-KEY: <admin-key>" \
	-H "Content-Type: application/json" \
	-d '{
		"label": "Payments Producer",
		"producer": "payments-service",
		"admin": false
	}'
```

## Events API

### `GET /api/v1/events`

Streams live lifecycle events as `text/event-stream`.

Common event types:

- `JOB_CREATED`
- `JOB_UPDATE`
- `JOB_STARTED`
- `JOB_COMPLETED`
- `JOB_FAILED`

## End-to-End Example

1. Create producer key with admin key.
2. Submit job with producer key.
3. Poll job status.
4. Inspect admin metrics.

```bash
# 1) Create producer key
curl -X POST http://localhost:8080/api/v1/admin/keys \
	-H "X-API-KEY: <admin-key>" \
	-H "Content-Type: application/json" \
	-d '{"label":"Demo","producer":"demo-producer","admin":false}'

# 2) Submit job
curl -X POST http://localhost:8080/api/v1/jobs \
	-H "X-API-KEY: <producer-key>" \
	-H "Content-Type: application/json" \
	-d '{
		"jobType":"webhook",
		"idempotencyKey":"demo-1",
		"priority":"NORMAL",
		"payload":{"ping":true},
		"execution":{"type":"HTTP","endpoint":"https://httpbin.org/post"}
	}'

# 3) Get job by ID
curl -H "X-API-KEY: <producer-key>" http://localhost:8080/api/v1/jobs/<job-id>

# 4) Check cluster metrics
curl -H "X-API-KEY: <admin-key>" http://localhost:8080/api/v1/admin/metrics
```

### Retry a DLQ Job

```bash
curl -X POST -H "X-API-KEY: <admin-key>" http://localhost:8080/api/v1/admin/dlq/<id>/retry
```

## What Is Not Yet Shipped

The current API surface does not include:

- SDKs for Java, Node.js, or Python
- A dedicated scheduler admin screen
- A collector/backend bundle for viewing traces in Grafana or another tracing UI
