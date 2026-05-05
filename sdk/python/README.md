# SAB Python SDK

Python SDK for SAB (Smart Asynchronous Broker).

## Installation

```bash
pip install sab-sdk
```

## Quick Start

```python
import asyncio
from sab import SabClient


async def main() -> None:
 async with (
 SabClient.builder()
 .base_url("http://localhost:8080")
 .api_key("your-api-key")
 .tenant_id("your-tenant-id")
 .timeout(30000)
 .retry(3, 1000)
 .build()
 ) as client:
 job = await client.submit_job(
 {
 "job_type": "webhook",
 "priority": "HIGH",
 "payload": {"event": "invoice.created", "invoice_id": "inv_1024"},
 "execution": {
 "type": "HTTP",
 "endpoint": "https://example.com/hooks/invoice",
 "timeout_seconds": 30,
 },
 "max_attempts": 5,
 "tags": {"service": "billing", "environment": "prod"},
 }
 )

 final_state = await client.wait_for_job(
 job.job_id,
 timeout=120.0,
 poll_interval=1.0,
 stop_on_status=["SUCCESS", "FAILED", "DLQ"],
 )

 print("Job status:", final_state.status)


if __name__ == "__main__":
 asyncio.run(main())
```

## Common Workflows

### Create a recurring schedule

```python
schedule = await client.create_schedule(
 {
 "cron": "0 */15 * * * *",
 "job_type": "webhook",
 "priority": "NORMAL",
 "payload": {"action": "sync_catalog"},
 "execution": {
 "type": "HTTP",
 "endpoint": "https://example.com/internal/catalog/sync",
 "timeout_seconds": 20,
 },
 }
)

print("Schedule created:", schedule.schedule_id)
```

### Inspect and recover DLQ jobs

```python
dlq_items = await client.list_dlq()

for item in dlq_items[:5]:
 retried = await client.retry_dlq_job(item.job_id)
 print(item.job_id, "retried" if retried else "retry-failed")
```

## Error Handling

```python
from sab import SABError

try:
 await client.submit_job(
 {
 "job_type": "webhook",
 "priority": "NORMAL",
 "payload": {"ping": True},
 "execution": {
 "type": "HTTP",
 "endpoint": "https://example.com/ping",
 "timeout_seconds": 10,
 },
 }
 )
except SABError as exc:
 print("SAB request failed:", exc.message)
```

## Development

```bash
pip install -e .
pytest
pytest --cov=sab
```

## Support

- Documentation: https://github.com/learnerview/sab
- Issue tracker: https://github.com/learnerview/sab/issues
- Discussions: https://github.com/learnerview/sab/discussions

## License

MIT License. See LICENSE.
