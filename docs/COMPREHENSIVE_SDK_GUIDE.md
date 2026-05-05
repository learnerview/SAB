# SAB SDK Guide

## Overview

SAB SDKs provide language-native interfaces to the job scheduling platform. All SDKs follow the same architecture:

- **Type-safe**: Strong typing with IDE autocomplete
- **Async-first**: Support for concurrent operations
- **Resilient**: Automatic retries with exponential backoff
- **Observable**: Distributed tracing & detailed logging
- **Production-ready**: Used at scale by enterprise customers

## Installation

### Java SDK

```bash
# Maven
<dependency>
 <groupId>com.learnerview.sab</groupId>
 <artifactId>sab-java-sdk</artifactId>
 <version>2.0.0</version>
</dependency>

# Gradle
implementation 'com.learnerview.sab:sab-java-sdk:2.0.0'
```

### Node.js SDK

```bash
npm install @learnerview/sab-sdk
# or
yarn add @learnerview/sab-sdk
```

### Python SDK

```bash
pip install sab-sdk
```

## Quick Start

### Java

```java
import com.learnerview.sab.client.SabClient;
import com.learnerview.sab.model.JobRequest;
import com.learnerview.sab.model.JobResponse;

// Initialize client
SabClient client = SabClient.builder()
 .baseUrl("https://api.sab.com")
 .apiKey("sk_test_...")
 .build();

// Submit a job
JobRequest request = JobRequest.builder()
 .jobType("payment-webhook")
 .priority("HIGH")
 .payload(Map.of("orderId", "12345", "amount", 99.99))
 .execution(ExecutionPolicy.builder()
 .type(ExecutionType.HTTP)
 .endpoint("https://your-api.com/webhooks/payment")
 .timeoutSeconds(30)
 .build())
 .maxAttempts(3)
 .build();

JobResponse response = client.submitJob(request);
System.out.println("Job ID: " + response.getJobId());

// Poll for result
JobResponse completed = client.waitForJob(response.getJobId(), Duration.ofSeconds(60));
System.out.println("Status: " + completed.getStatus());
System.out.println("Result: " + completed.getResult());
```

### Node.js

```typescript
import { SabClient, JobPriority, ExecutionType } from '@learnerview/sab-sdk';

// Initialize client
const client = new SabClient({
 baseUrl: 'https://api.sab.com',
 apiKey: 'sk_test_...',
});

// Submit a job
const response = await client.submitJob({
 jobType: 'payment-webhook',
 priority: JobPriority.HIGH,
 payload: {
 orderId: '12345',
 amount: 99.99,
 },
 execution: {
 type: ExecutionType.HTTP,
 endpoint: 'https://your-api.com/webhooks/payment',
 timeoutSeconds: 30,
 },
 maxAttempts: 3,
});

console.log(`Job ID: ${response.jobId}`);

// Wait for result
const completed = await client.waitForJob(response.jobId, 60000);
console.log(`Status: ${completed.status}`);
console.log(`Result: ${JSON.stringify(completed.result)}`);
```

### Python

```python
import asyncio
from sab.client import SabClient
from sab.models import JobPriority, ExecutionType

async def main():
 # Initialize client
 client = SabClient(
 base_url='https://api.sab.com',
 api_key='sk_test_...',
 )
 
 # Submit a job
 response = await client.submit_job(
 job_type='payment-webhook',
 priority=JobPriority.HIGH,
 payload={
 'orderId': '12345',
 'amount': 99.99,
 },
 execution={
 'type': ExecutionType.HTTP,
 'endpoint': 'https://your-api.com/webhooks/payment',
 'timeout_seconds': 30,
 },
 max_attempts=3,
 )
 
 print(f'Job ID: {response.job_id}')
 
 # Wait for result
 completed = await client.wait_for_job(response.job_id, timeout=60)
 print(f'Status: {completed.status}')
 print(f'Result: {completed.result}')

asyncio.run(main())
```

## Common Patterns

### Batch Job Submission

```java
// Java
List<JobRequest> requests = new ArrayList<>();
for (int i = 0; i < 100; i++) {
 requests.add(JobRequest.builder()
 .jobType("email-send")
 .payload(Map.of("recipient", "user" + i + "@example.com"))
 .build());
}

List<JobResponse> responses = client.submitJobsBatch(requests);
System.out.println("Submitted " + responses.size() + " jobs");
```

```typescript
// Node.js
const requests = Array.from({ length: 100 }, (_, i) => ({
 jobType: 'email-send',
 payload: { recipient: `user${i}@example.com` },
}));

const responses = await client.submitJobsBatch(requests);
console.log(`Submitted ${responses.length} jobs`);
```

```python
# Python
requests = [
 {
 'job_type': 'email-send',
 'payload': {'recipient': f'user{i}@example.com'},
 }
 for i in range(100)
]

responses = await client.submit_jobs_batch(requests)
print(f'Submitted {len(responses)} jobs')
```

### Recurring Schedules

```java
// Java
ScheduleRequest schedule = ScheduleRequest.builder()
 .cron("0 0 * * *") // Daily at midnight
 .jobType("daily-report")
 .priority("NORMAL")
 .payload(Map.of("reportType", "summary"))
 .build();

ScheduleResponse created = client.createSchedule(schedule);
System.out.println("Schedule ID: " + created.getId());
System.out.println("Next run: " + created.getNextRunAt());
```

### Error Handling

```java
// Java
try {
 JobResponse response = client.submitJob(request);
} catch (SabException e) {
 // Handle SAB errors
 System.err.println("Error: " + e.getMessage());
 System.err.println("Error code: " + e.getErrorCode());
 if (e.isRetryable()) {
 // Retry with backoff
 }
} catch (IOException e) {
 // Handle network errors
 System.err.println("Network error: " + e.getMessage());
} catch (TimeoutException e) {
 // Handle timeout
 System.err.println("Request timeout");
}
```

```typescript
// Node.js
try {
 const response = await client.submitJob(request);
} catch (error) {
 if (error instanceof SABError) {
 console.error(`Error: ${error.message}`);
 console.error(`Code: ${error.code}`);
 if (error.isRetryable()) {
 // Retry with backoff
 }
 } else if (error instanceof TimeoutError) {
 console.error('Request timeout');
 } else {
 console.error(`Unexpected error: ${error.message}`);
 }
}
```

```python
# Python
try:
 response = await client.submit_job(request)
except SABError as e:
 print(f'Error: {e.message}')
 print(f'Code: {e.code}')
 if e.is_retryable:
 # Retry with backoff
 pass
except asyncio.TimeoutError:
 print('Request timeout')
except Exception as e:
 print(f'Unexpected error: {e}')
```

### Distributed Tracing Integration

```java
// Java - Automatic OpenTelemetry integration
SabClient client = SabClient.builder()
 .baseUrl("https://api.sab.com")
 .apiKey("sk_test_...")
 .tracingEnabled(true)
 .tracingExportEndpoint("http://localhost:4317")
 .build();

// All SDK calls automatically create spans
// Trace context flows through to job execution
```

```typescript
// Node.js - Automatic OpenTelemetry integration
const client = new SabClient({
 baseUrl: 'https://api.sab.com',
 apiKey: 'sk_test_...',
 tracing: {
 enabled: true,
 exportEndpoint: 'http://localhost:4317',
 },
});
```

```python
# Python - Automatic OpenTelemetry integration
client = SabClient(
 base_url='https://api.sab.com',
 api_key='sk_test_...',
 tracing=True,
 tracing_export_endpoint='http://localhost:4317',
)
```

## Advanced Configuration

### Connection Pooling

```java
// Java
SabClient client = SabClient.builder()
 .baseUrl("https://api.sab.com")
 .apiKey("sk_test_...")
 .connectionPool(
 maxIdleConnections: 20,
 keepAliveSeconds: 300,
 connectionTimeoutSeconds: 30)
 .build();
```

### Custom Serialization

```java
// Java - Custom ObjectMapper
ObjectMapper objectMapper = new ObjectMapper();
objectMapper.registerModule(new JavaTimeModule());
objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

SabClient client = SabClient.builder()
 .baseUrl("https://api.sab.com")
 .apiKey("sk_test_...")
 .objectMapper(objectMapper)
 .build();
```

### Retry Strategy

```java
// Java
SabClient client = SabClient.builder()
 .baseUrl("https://api.sab.com")
 .apiKey("sk_test_...")
 .retry(
 maxRetries: 5,
 backoffMultiplier: 2.0,
 initialBackoffMs: 100,
 maxBackoffMs: 10000)
 .build();
```

## Performance Considerations

### Batch Processing
- Use `submitJobsBatch()` for better throughput
- Batch size 100-1000 depending on payload
- Network parallelism increases efficiency

### Connection Reuse
- Create one client instance per application
- Reuse across threads (all SDKs are thread-safe)
- Connection pooling handles multiplexing

### Memory Management
- Large payloads are streamed where possible
- Payload size limit: 10MB
- Consider compression for large JSON payloads

### Rate Limiting
- Default: 600 requests/minute per API key
- Contact support for higher limits
- Implement exponential backoff for 429 responses

## Testing

### Unit Testing

```java
// Java - Mock example
@Test
public void testJobSubmission() {
 SabClient client = new MockSabClient();
 
 JobResponse response = client.submitJob(request);
 
 assertThat(response.getJobId()).isNotNull();
 assertThat(response.getStatus()).isEqualTo(JobStatus.QUEUED);
}
```

```typescript
// Node.js - Jest example
describe('JobSubmission', () => {
 it('should submit job successfully', async () => {
 const client = new MockSabClient();
 
 const response = await client.submitJob(request);
 
 expect(response.jobId).toBeDefined();
 expect(response.status).toBe(JobStatus.QUEUED);
 });
});
```

### Integration Testing

```bash
# Run against test server
export SAB_BASE_URL=http://localhost:8080
export SAB_API_KEY=sk_test_local_key

# Java
mvn test

# Node.js
npm test

# Python
pytest
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Check API key, ensure it's active |
| 429 Rate Limited | Implement exponential backoff, upgrade limits |
| 500 Server Error | Check server status, try again with backoff |
| Connection timeout | Increase timeout, check network connectivity |
| Payload too large | Keep payloads <10MB, use compression |
| Scheduled job not running | Check cron expression, ensure schedule is active |

## Support

- **Documentation**: https://docs.sab.com
- **Examples**: https://github.com/learnerview/sab/tree/main/examples
- **Issues**: https://github.com/learnerview/sab/issues
- **Email**: support@sab.com
- **Slack**: Join our community Slack for real-time help
