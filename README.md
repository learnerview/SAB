# SAB Platform (Smart Asynchronous Broker)

SAB (Smart Asynchronous Broker) is a production-grade execution control plane for background work. It combines durable job storage, priority-aware scheduling, retry policies, and observability into a single platform for asynchronous workloads.

## What SAB Provides

- Durable job execution backed by PostgreSQL with Redis queueing.
- Priority-aware scheduling with configurable retry and timeout policies.
- Dead-letter queue (DLQ) tooling for failed-job recovery.
- Operational visibility with Prometheus metrics, Grafana dashboards, and OpenTelemetry tracing.
- Multi-tenant controls for workload isolation.
- Official SDKs for Python, Node.js, and Java.

## Repository Layout

```text
docs/ Developer and API documentation
infrastructure/ Runtime infrastructure (monitoring, nginx, redis)
scripts/ Operational scripts
sdk/ Official SDKs (java, nodejs, python)
src/ Core backend service (Spring Boot)
web/ Admin interface
```

## Quick Start

### Local Development with Docker Compose

1. Clone and enter the repository.

```bash
git clone https://github.com/learnerview/sab.git
cd sab
```

2. Create local environment settings.

```bash
cp .env.example .env
```

3. Start the platform.

```bash
docker compose up -d --build
```

4. Optional: start the monitoring profile.

```bash
docker compose --profile monitoring up -d
```

### Local Endpoints

- API: http://localhost:8080
- Admin UI: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## API Example

Submit a webhook job and then fetch its status:

```bash
curl -X POST "http://localhost:8080/api/v1/jobs" \
 -H "Content-Type: application/json" \
 -H "X-API-Key: <api-key>" \
 -H "X-Tenant-ID: <tenant-id>" \
 -d '{
 "jobType": "webhook",
 "priority": "HIGH",
 "payload": {"event": "invoice.created", "invoiceId": "inv_1024"},
 "execution": {
 "type": "HTTP",
 "endpoint": "https://example.com/hooks/invoice",
 "timeoutSeconds": 30
 }
 }'
```

```bash
curl -X GET "http://localhost:8080/api/v1/jobs/<job-id>" \
 -H "X-API-Key: <api-key>" \
 -H "X-Tenant-ID: <tenant-id>"
```

## Documentation

- [Documentation Index](docs/INDEX.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [How-To Guides](docs/HOW_TO_GUIDES.md)
- [SDK Guide](docs/COMPREHENSIVE_SDK_GUIDE.md)
- [Architecture Guide](docs/ARCHITECTURE_GUIDE.md)

## SDKs

| SDK | Runtime | Installation |
|-----|---------|--------------|
| [Python](sdk/python) | Python 3.9+ | `pip install sab-sdk` |
| [Node.js](sdk/nodejs) | Node.js 16+ | `npm install @learnerview/sab-sdk` |
| [Java](sdk/java) | Java 17+ | See [sdk/java/README.md](sdk/java/README.md) |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, coding standards, and pull request requirements.

## Security

See [SECURITY.md](SECURITY.md) to report vulnerabilities and follow responsible disclosure.

## License

MIT License. See [LICENSE](LICENSE).
