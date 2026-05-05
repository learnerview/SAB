# SAB Node.js SDK

Node.js and TypeScript SDK for SAB (Smart Asynchronous Broker).

## Installation

```bash
npm install @learnerview/sab-sdk
```

## Quick Start

```typescript
import { SabClient } from '@learnerview/sab-sdk';

const client = SabClient.builder()
 .baseUrl('http://localhost:8080')
 .apiKey(process.env.SAB_API_KEY || '')
 .tenantId(process.env.SAB_TENANT_ID || '')
 .build();

const job = await client.submitJobAsync({
 jobType: 'webhook',
 priority: 'HIGH',
 payload: { event: 'invoice.created', invoiceId: 'inv_1024' },
 execution: {
 type: 'HTTP',
 endpoint: 'https://example.com/hooks/invoice',
 timeoutSeconds: 30,
 },
 maxAttempts: 5,
 tags: { service: 'billing', environment: 'prod' },
});

const finalState = await client.waitForJob(job.jobId, {
 timeout: 120000,
 pollInterval: 1000,
 stopOnStatus: ['SUCCESS', 'FAILED', 'DLQ'],
});

console.log('Job result:', finalState.status);
```

## Common Workflows

### Create a recurring schedule

```typescript
const schedule = await client.createScheduleAsync({
 cron: '0 */15 * * * *',
 jobType: 'webhook',
 priority: 'NORMAL',
 payload: { action: 'sync_catalog' },
 execution: {
 type: 'HTTP',
 endpoint: 'https://example.com/internal/catalog/sync',
 timeoutSeconds: 20,
 },
});

console.log('Schedule created:', schedule.scheduleId);
```

### Inspect and recover DLQ jobs

```typescript
const dlqItems = await client.listDLQAsync();

for (const item of dlqItems.slice(0, 5)) {
 const retried = await client.retryDLQJobAsync(item.jobId);
 console.log(item.jobId, retried ? 'retried' : 'retry-failed');
}
```

## Error Handling

```typescript
import { SABError } from '@learnerview/sab-sdk';

try {
 await client.submitJobAsync({
 jobType: 'webhook',
 priority: 'NORMAL',
 payload: { ping: true },
 execution: {
 type: 'HTTP',
 endpoint: 'https://example.com/ping',
 timeoutSeconds: 10,
 },
 });
} catch (error) {
 if (error instanceof SABError) {
 console.error('SAB request failed:', error.message);
 } else {
 console.error('Unexpected error:', error);
 }
}
```

## Development

```bash
npm run build
npm test
npm run lint
```

## Support

- Documentation: https://github.com/learnerview/sab
- Issue tracker: https://github.com/learnerview/sab/issues
- Discussions: https://github.com/learnerview/sab/discussions

## License

MIT License. See LICENSE.
