# How-To Guides

These are practical workflows for the most common production tasks.

## 1. Onboard a New Tenant

Use this flow when a new customer or internal service needs access to SAB.

1. Log in with an admin key.
2. Open the Admin page or call the API.
3. Create a tenant-specific producer key.
4. Store the returned secret in your secret manager.
5. Give the application that tenant key, not the admin key.

Example:

```bash
curl -X POST http://localhost:8080/api/v1/admin/keys \
 -H "X-API-KEY: <admin-key>" \
 -H "Content-Type: application/json" \
 -d '{
 "label": "Payments service",
 "producer": "payments-prod",
 "admin": false
 }'
```

Why this matters:

- Tenant isolation is enforced by the API key.
- The producer key limits the app to its own queue and job records.
- Admin keys should stay in operator-only environments.

## 2. Connect Your Application

Your application should call SAB over HTTPS in production.

Recommended integration pattern:

1. Build the job payload in your application.
2. Add an idempotency key that uniquely identifies the logical event.
3. Send the job to `POST /api/v1/jobs`.
4. Store the returned job ID in your own database if you need cross-reference lookup.
5. Poll `GET /api/v1/jobs/{id}` or subscribe to events if you need near-real-time status.

Example job submission:

```bash
curl -X POST http://localhost:8080/api/v1/jobs \
 -H "X-API-KEY: <producer-key>" \
 -H "Content-Type: application/json" \
 -d '{
 "jobType": "webhook",
 "idempotencyKey": "invoice-456",
 "priority": "NORMAL",
 "payload": { "invoiceId": "456", "source": "billing" },
 "execution": {
 "type": "HTTP",
 "endpoint": "https://httpbin.org/post"
 },
 "timeoutSeconds": 10,
 "maxAttempts": 3
 }'
```

## 3. Submit a Job Safely

Use this checklist before you submit a production job:

- The `execution.endpoint` is reachable.
- The payload is valid JSON.
- The `idempotencyKey` is stable and unique per business event.
- The chosen `priority` reflects business urgency.
- The timeout is long enough for the downstream system.
- The retry count matches the downstream service's tolerance.

Practical examples:

- `HIGH` for customer-facing webhook delivery.
- `NORMAL` for standard internal syncs.
- `LOW` for non-urgent batch work.

## 4. Monitor a Job

Use one of these options:

- `GET /api/v1/jobs/{id}` for a single record.
- `GET /api/v1/jobs` for a paged tenant view.
- The dashboard for a visual operational view.
- The event stream for live updates.

Typical states you will see:

- `QUEUED`
- `RUNNING`
- `SUCCESS`
- `RETRY_SCHEDULED`
- `FAILED`
- `DLQ`

## 5. Handle DLQ Jobs

A job moves to the DLQ when retries are exhausted.

Steps:

1. Inspect the failure reason.
2. Confirm the downstream service is healthy.
3. Fix the root cause.
4. Retry the job from the Admin page or API.

Example:

```bash
curl -H "X-API-KEY: <admin-key>" http://localhost:8080/api/v1/admin/dlq
```

Retry example:

```bash
curl -X POST -H "X-API-KEY: <admin-key>" http://localhost:8080/api/v1/admin/dlq/<id>/retry
```

## 6. Create a Recurring Workflow

Use schedules for repeat work such as daily refreshes or periodic syncs.

Example recurring job:

```bash
curl -X POST http://localhost:8080/api/v1/schedules \
 -H "X-API-KEY: <producer-key>" \
 -H "Content-Type: application/json" \
 -d '{
 "cron": "0 0 * * * *",
 "jobType": "nightly-report",
 "priority": "LOW",
 "payload": { "reportType": "daily" },
 "execution": {
 "type": "HTTP",
 "endpoint": "https://httpbin.org/post"
 },
 "maxAttempts": 3
 }'
```

Use cases:

- Nightly billing exports
- Customer sync every 15 minutes
- Hourly health checks
- Weekly archive refreshes

Operational rule:

- The schedule runner creates a new job each time the cron expression becomes due.
- The job then follows the same retry and DLQ path as any other job.

## 7. Use the Admin Console

Open http://localhost:8080/admin when you need to manage the platform.

The tabs are used for:

- Key management
- Cluster metrics
- Operational stats
- Handler or system summaries

Use the Admin page when you need to answer questions like:

- How many jobs are currently queued?
- What is the current success rate?
- Which jobs are in the DLQ?
- Which tenant keys are active?

## 8. Use the Real-Time Event Stream

The UI subscribes to the live event feed at `/api/v1/events`.

This is useful when you want to:

- Update a dashboard without polling.
- Watch job transitions as they happen.
- Drive internal operator tooling.

Example browser-side usage:

```javascript
const events = new EventSource('/api/v1/events');
events.onmessage = (event) => console.log(event.data);
```

## 9. Deploy in Docker

Start the full stack:

```bash
docker compose up -d --build
```

Start the monitoring stack too:

```bash
docker compose --profile monitoring up -d --build
```

Stop everything:

```bash
docker compose down
```

If you are preparing a production host, make sure you also provide:

- PostgreSQL persistence
- Redis persistence
- Secret management for API keys
- Reverse proxy or ingress termination for HTTPS

## 10. Run Without Docker

Use this when you already have managed PostgreSQL and Redis:

```bash
export SPRING_PROFILES_ACTIVE=api,worker,ui
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sab
export SPRING_DATASOURCE_USERNAME=sab
export SPRING_DATASOURCE_PASSWORD=sab
export REDIS_URL=redis://localhost:6379
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
mvn spring-boot:run
```

## 11. Troubleshoot Common Issues

### Login fails

- Verify the API key is active.
- Verify the key belongs to the expected tenant.
- Verify the application is sending `X-API-KEY`.

### Jobs stay queued

- Confirm the `worker` profile is active.
- Confirm Redis is healthy.
- Confirm PostgreSQL is healthy.
- Inspect worker logs for lease or execution failures.

### Jobs retry too aggressively

- Increase `timeoutSeconds`.
- Increase `maxAttempts` only if the downstream system can handle it.
- Reduce request volume or lower the priority if needed.

### Jobs go to the DLQ quickly

- Check the downstream endpoint status.
- Check the HTTP response body or error message.
- Re-test the endpoint manually before retrying.

### Metrics are empty

- Confirm the app is up.
- Confirm the `api` and `worker` profiles are enabled.
- Open `/actuator/prometheus` directly.

### Traces are not exported

- Set `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Confirm the collector is reachable.
- Confirm the collector accepts OTLP HTTP traffic.

## 12. What Is Not Available Yet

These workflows are not shipped yet:

- SDK-based client libraries
- Dedicated scheduler admin screens
- A built-in tracing UI
