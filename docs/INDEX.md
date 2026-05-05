# SAB Documentation Index

SAB stands for Smart Asynchronous Broker.

This documentation set is focused on what developers and operators need most: setup, API behavior, method definitions, and integration examples.

## Primary Documents

1. [GETTING_STARTED.md](GETTING_STARTED.md): first-run setup and first successful API calls.
2. [API_DOCUMENTATION.md](API_DOCUMENTATION.md): endpoint-by-endpoint API reference with request and response definitions.
3. [HOW_TO_GUIDES.md](HOW_TO_GUIDES.md): practical workflows such as tenant onboarding, DLQ handling, and schedules.
4. [COMPREHENSIVE_SDK_GUIDE.md](COMPREHENSIVE_SDK_GUIDE.md): SDK usage in Java, Node.js, and Python.
5. [ARCHITECTURE_GUIDE.md](ARCHITECTURE_GUIDE.md): platform architecture and runtime behavior.
6. [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md): implemented features and known scope.

## Quick API Usage Path

1. Create a producer key with `POST /api/v1/admin/keys`.
2. Submit a job with `POST /api/v1/jobs`.
3. Read a job with `GET /api/v1/jobs/{id}`.
4. Create recurrence with `POST /api/v1/schedules`.
5. Operate failures with `GET /api/v1/admin/dlq` and `POST /api/v1/admin/dlq/{id}/retry`.

## Publish Readiness Checklist

1. Docker Compose stack starts cleanly.
2. Admin and producer key authentication both work.
3. Job lifecycle reaches expected terminal states.
4. Schedule creation and cancellation are validated.
5. DLQ listing and retry behavior are validated.
6. SDK examples run successfully against local API.
