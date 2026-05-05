# Getting Started

This guide shows how to connect a real application to SAB, from first boot to the first job and the first recurring schedule.

## What You Need

Before you start, make sure you have:

- Docker and Docker Compose for the full stack
- Git for cloning the repository
- A terminal
- Optional: Java 17+ and Maven 3.9+ if you want to run without Docker

You also need one of the following deployment modes:

- Full local stack with Docker Compose
- A standalone app connected to your own PostgreSQL and Redis
- A production deployment behind your own reverse proxy or ingress

## The Moving Parts

SAB uses three main runtime pieces:

- The web/API process exposes the HTTP endpoints and the UI.
- PostgreSQL stores job, schedule, API key, and audit data.
- Redis stores queue state, leases, and worker coordination data.

Your application does not talk to Redis or PostgreSQL directly. It talks to SAB over HTTP.

## Start the Stack with Docker

```bash
git clone https://github.com/your-org/sab.git
cd sab
docker compose up -d --build
```

Wait until the main services are healthy:

- `app`
- `postgres`
- `redis`

Then open:

- UI: http://localhost:8080
- Login: http://localhost:8080/login
- Health: http://localhost:8080/actuator/health
- Metrics: http://localhost:8080/actuator/prometheus

If you want dashboards, start the monitoring profile too:

```bash
docker compose --profile monitoring up -d --build
```

That gives you:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## Production Connection Flow

The normal production connection flow is:

1. An administrator creates an API key for a tenant.
2. Your application stores that key securely.
3. Your application uses the key in the `X-API-KEY` header.
4. Your application submits jobs or schedules to SAB.
5. SAB returns a job ID or schedule ID.
6. You use the job/schedule ID to monitor status and operational behavior.

If your application needs real-time updates, it can also subscribe to the server-sent events stream used by the UI.

## Create the First Tenant Key

You need an admin key to create a producer key. This is the normal bootstrap step.

```bash
curl -X POST http://localhost:8080/api/v1/admin/keys \
 -H "X-API-KEY: <admin-key>" \
 -H "Content-Type: application/json" \
 -d '{
 "label": "Demo producer",
 "producer": "demo-producer",
 "admin": false
 }'
```

The response returns the generated secret. Keep that secret in your application configuration or secret manager. Do not log it.

## Submit Your First Job

A job is the simplest integration point when your app needs to hand off one HTTP call to the worker engine.

```bash
curl -X POST http://localhost:8080/api/v1/jobs \
 -H "X-API-KEY: <producer-key>" \
 -H "Content-Type: application/json" \
 -d '{
 "jobType": "webhook",
 "idempotencyKey": "order-123",
 "priority": "HIGH",
 "payload": { "orderId": "123", "amount": 99.99 },
 "execution": {
 "type": "HTTP",
 "endpoint": "https://httpbin.org/post"
 },
 "maxAttempts": 3,
 "timeoutSeconds": 10
 }'
```

What to expect:

- HTTP `202 Accepted`
- A job ID in the response
- The job appearing in the dashboard and jobs page
- The job moving through queued, running, success, retry, or DLQ states depending on outcome

### Why the `idempotencyKey` Matters

If your application can retry the same logical submission, the `idempotencyKey` prevents duplicate work. Use one stable key per logical business event.

Examples:

- `order-123`
- `invoice-456`
- `payment-2026-05-04-001`

## Create a Recurring Schedule

Use schedules when your application needs a job to fire repeatedly on a cron cadence.

```bash
curl -X POST http://localhost:8080/api/v1/schedules \
 -H "X-API-KEY: <producer-key>" \
 -H "Content-Type: application/json" \
 -d '{
 "cron": "0 */15 * * * *",
 "jobType": "report-refresh",
 "priority": "NORMAL",
 "payload": { "reportType": "summary" },
 "execution": {
 "type": "HTTP",
 "endpoint": "https://httpbin.org/post"
 },
 "maxAttempts": 3
 }'
```

The cron expression above means every 15 minutes.

List schedules:

```bash
curl http://localhost:8080/api/v1/schedules \
 -H "X-API-KEY: <producer-key>"
```

Cancel a schedule:

```bash
curl -X DELETE http://localhost:8080/api/v1/schedules/<schedule-id> \
 -H "X-API-KEY: <producer-key>"
```

## Check Status and Monitor Work

Read a single job:

```bash
curl http://localhost:8080/api/v1/jobs/<job-id> \
 -H "X-API-KEY: <producer-key>"
```

List jobs:

```bash
curl "http://localhost:8080/api/v1/jobs?page=0&size=20" \
 -H "X-API-KEY: <producer-key>"
```

For live updates, use the dashboard or the event stream endpoint.

## Local Run Without Docker

If you already have PostgreSQL and Redis, you can run the app locally like this:

```bash
export SPRING_PROFILES_ACTIVE=api,worker,ui
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sab
export SPRING_DATASOURCE_USERNAME=sab
export SPRING_DATASOURCE_PASSWORD=sab
export REDIS_URL=redis://localhost:6379
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
mvn spring-boot:run
```

## How the Runtime Behaves

Once a job is submitted, SAB handles the rest:

- It stores the durable job record in PostgreSQL.
- It enqueues the work in Redis.
- The worker claims the job.
- The worker sends the HTTP request to your configured downstream endpoint.
- Success updates the job to `SUCCESS`.
- Failure retries with backoff until attempts are exhausted.
- Exhausted jobs move to the DLQ.
- Lease recovery reclaims jobs that were left in an incomplete running state.

Recurring schedules work the same way, except the schedule runner creates a fresh job each time the cron expression becomes due.

## Operational Checks

Use these checks before and after go-live:

- Health: `/actuator/health`
- Metrics: `/actuator/prometheus`
- Admin stats: `/api/v1/admin/stats`
- Admin metrics: `/api/v1/admin/metrics`
- DLQ page: `/dlq`
- Job page: `/jobs`
- Admin page: `/admin`

## Common Troubleshooting

### Login fails

- Check that the API key is active.
- Check that the key belongs to the expected tenant.
- Make sure the application is sending `X-API-KEY`.

### Jobs stay queued

- Confirm the worker profile is running.
- Verify Redis is healthy.
- Verify PostgreSQL is healthy.
- Check the worker logs for claim or execution errors.

### Metrics are empty

- Confirm the app is running.
- Confirm the `api` and `worker` profiles are active.
- Check `/actuator/prometheus` directly.

### Traces are not exported

- Confirm `OTEL_EXPORTER_OTLP_ENDPOINT` points to a reachable collector.
- Confirm your collector is listening for OTLP HTTP on `/v1/traces`.
- Confirm tracing is enabled in application properties.

## What This Guide Does Not Cover

This guide focuses on direct HTTP API usage. For SDK-specific usage, see `docs/COMPREHENSIVE_SDK_GUIDE.md` and the language-specific README files under `sdk/`.
