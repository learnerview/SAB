import nock from 'nock';
import { SabClient } from '../client';
import { SABError } from '../error';

describe('SabClient', () => {
  let client: SabClient;
  let scope: nock.Scope;

  beforeEach(() => {
    client = SabClient.builder()
      .baseUrl('http://localhost:8080')
      .apiKey('test-api-key')
      .tenantId('test-tenant')
      .timeout(5000)
      .retry(2, 100)
      .build();

    scope = nock('http://localhost:8080');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Job Operations', () => {
    test('should submit a job successfully', async () => {
      scope.post('/api/v1/jobs').reply(201, {
        success: true,
        message: 'Job submitted successfully',
        data: {
          jobId: 'job-123',
          jobType: 'webhook',
          priority: 'NORMAL',
          status: 'QUEUED',
        },
      });

      const job = await client.submitJobAsync({
        jobType: 'webhook',
        priority: 'NORMAL',
        payload: { message: 'Hello World' },
        execution: {
          type: 'HTTP',
          endpoint: 'https://example.com/webhook',
          timeoutSeconds: 30,
        },
      });

      expect(job.jobId).toBe('job-123');
      expect(job.jobType).toBe('webhook');
      expect(job.status).toBe('QUEUED');
    });

    test('should get a job successfully', async () => {
      scope.get('/api/v1/jobs/job-123').reply(200, {
        success: true,
        data: {
          jobId: 'job-123',
          jobType: 'webhook',
          priority: 'NORMAL',
          status: 'RUNNING',
        },
      });

      const job = await client.getJobAsync('job-123');
      expect(job).toBeTruthy();
      expect(job!.jobId).toBe('job-123');
      expect(job!.status).toBe('RUNNING');
    });

    test('should return null for non-existent job', async () => {
      scope.get('/api/v1/jobs/non-existent').reply(404, {
        success: false,
        message: 'Job not found',
        errorCode: 'NOT_FOUND',
      });

      const job = await client.getJobAsync('non-existent');
      expect(job).toBeNull();
    });

    test('should list jobs successfully', async () => {
      scope.get('/api/v1/jobs').reply(200, {
        success: true,
        data: [
          {
            jobId: 'job-123',
            jobType: 'webhook',
            priority: 'NORMAL',
            status: 'QUEUED',
          },
          {
            jobId: 'job-456',
            jobType: 'webhook',
            priority: 'HIGH',
            status: 'RUNNING',
          },
        ],
      });

      const jobs = await client.listJobsAsync();
      expect(jobs).toHaveLength(2);
      expect(jobs[0]!.jobId).toBe('job-123');
      expect(jobs[1]!.jobId).toBe('job-456');
    });

    test('should cancel a job successfully', async () => {
      scope.delete('/api/v1/jobs/job-123').reply(200, {
        success: true,
        message: 'Job cancelled successfully',
      });

      const result = await client.cancelJobAsync('job-123');
      expect(result).toBe(true);
    });

    test('should handle job submission error', async () => {
      scope.post('/api/v1/jobs').reply(400, {
        success: false,
        message: 'Invalid job type',
        errorCode: 'VALIDATION_ERROR',
      });

      await expect(
        client.submitJobAsync({
          jobType: 'invalid',
          priority: 'NORMAL',
        })
      ).rejects.toThrow(SABError);
    });
  });

  describe('Schedule Operations', () => {
    test('should create a schedule successfully', async () => {
      scope.post('/api/v1/schedules').reply(201, {
        success: true,
        message: 'Schedule created successfully',
        data: {
          id: 'schedule-123',
          cron: '0 0 * * *',
          jobType: 'webhook',
          priority: 'NORMAL',
          active: true,
        },
      });

      const schedule = await client.createScheduleAsync({
        cron: '0 0 * * *',
        jobType: 'webhook',
        priority: 'NORMAL',
        execution: {
          type: 'HTTP',
          endpoint: 'https://example.com/webhook',
        },
      });

      expect(schedule.id).toBe('schedule-123');
      expect(schedule.cron).toBe('0 0 * * *');
      expect(schedule.active).toBe(true);
    });

    test('should list schedules successfully', async () => {
      scope.get('/api/v1/schedules').reply(200, {
        success: true,
        data: [
          {
            id: 'schedule-123',
            cron: '0 0 * * *',
            jobType: 'webhook',
            priority: 'NORMAL',
            active: true,
          },
        ],
      });

      const schedules = await client.listSchedulesAsync();
      expect(schedules).toHaveLength(1);
      expect(schedules[0]!.id).toBe('schedule-123');
    });

    test('should cancel a schedule successfully', async () => {
      scope.delete('/api/v1/schedules/schedule-123').reply(200, {
        success: true,
        message: 'Schedule cancelled successfully',
      });

      const result = await client.cancelScheduleAsync('schedule-123');
      expect(result).toBe(true);
    });
  });

  describe('Admin Operations', () => {
    test('should get cluster stats successfully', async () => {
      scope.get('/api/v1/admin/stats').reply(200, {
        success: true,
        data: {
          totalJobs: 100,
          runningJobs: 10,
          queuedJobs: 20,
          successfulJobs: 60,
          failedJobs: 8,
          dlqJobs: 2,
          activeWorkers: 5,
          activeSchedules: 15,
        },
      });

      const stats = await client.getClusterStatsAsync();
      expect(stats.totalJobs).toBe(100);
      expect(stats.runningJobs).toBe(10);
      expect(stats.queuedJobs).toBe(20);
    });

    test('should get queue stats successfully', async () => {
      scope.get('/api/v1/admin/metrics').reply(200, {
        success: true,
        data: {
          queued: 20,
          running: 10,
          success: 60,
          failed: 8,
          dlq: 2,
          throughput: 5.5,
          avgExecutionTimeMs: 1500.0,
          avgWaitTimeMs: 300.0,
        },
      });

      const stats = await client.getQueueStatsAsync();
      expect(stats.queued).toBe(20);
      expect(stats.running).toBe(10);
      expect(stats.throughput).toBe(5.5);
    });

    test('should list DLQ items successfully', async () => {
      scope.get('/api/v1/admin/dlq').reply(200, {
        success: true,
        data: [
          {
            jobId: 'job-123',
            jobType: 'webhook',
            priority: 'NORMAL',
            status: 'DLQ',
            errorMessage: 'Connection timeout',
            attemptCount: 3,
            maxAttempts: 3,
          },
        ],
      });

      const dlqItems = await client.listDLQAsync();
      expect(dlqItems).toHaveLength(1);
      expect(dlqItems[0]!.jobId).toBe('job-123');
      expect(dlqItems[0]!.status).toBe('DLQ');
    });

    test('should retry DLQ job successfully', async () => {
      scope.post('/api/v1/admin/dlq/job-123/retry').reply(200, {
        success: true,
        message: 'Job retried successfully',
      });

      const result = await client.retryDLQJobAsync('job-123');
      expect(result).toBe(true);
    });

    test('should create API key successfully', async () => {
      scope.post('/api/v1/admin/keys').reply(201, {
        success: true,
        message: 'API key created successfully',
        data: {
          id: 'key-123',
          label: 'Test Key',
          producer: 'test-tenant',
          apiKey: 'sk-test-123456',
          isAdmin: false,
          active: true,
        },
      });

      const apiKey = await client.createApiKeyAsync({
        label: 'Test Key',
        producer: 'test-tenant',
        isAdmin: false,
      });

      expect(apiKey.id).toBe('key-123');
      expect(apiKey.apiKey).toBe('sk-test-123456');
      expect(apiKey.isAdmin).toBe(false);
    });

    test('should list API keys successfully', async () => {
      scope.get('/api/v1/admin/keys').reply(200, {
        success: true,
        data: [
          {
            id: 'key-123',
            label: 'Test Key',
            producer: 'test-tenant',
            isAdmin: false,
            active: true,
          },
        ],
      });

      const keys = await client.listApiKeysAsync();
      expect(keys).toHaveLength(1);
      expect(keys[0]!.id).toBe('key-123');
    });

    test('should delete API key successfully', async () => {
      scope.delete('/api/v1/admin/keys/key-123').reply(200, {
        success: true,
        message: 'API key deleted successfully',
      });

      const result = await client.deleteApiKeyAsync('key-123');
      expect(result).toBe(true);
    });

    test('should clear queues successfully', async () => {
      scope.delete('/api/v1/admin/queues').reply(200, {
        success: true,
        message: 'Queues cleared successfully',
      });

      const result = await client.clearQueues();
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      scope.post('/api/v1/jobs').replyWithError('Network error');

      await expect(
        client.submitJobAsync({
          jobType: 'webhook',
          priority: 'NORMAL',
        })
      ).rejects.toThrow(SABError);
    });

    test('should handle timeout errors', async () => {
      scope
        .post('/api/v1/jobs')
        .delay(10000) // 10 second delay
        .reply(200, { success: true, data: {} });

      await expect(
        client.submitJobAsync({
          jobType: 'webhook',
          priority: 'NORMAL',
        })
      ).rejects.toThrow(SABError);
    });

    test('should handle authentication errors', async () => {
      scope.get('/api/v1/jobs').reply(401, {
        success: false,
        message: 'Unauthorized',
        errorCode: 'AUTHENTICATION_ERROR',
      });

      await expect(client.listJobsAsync()).rejects.toThrow(SABError);
    });

    test('should handle rate limit errors', async () => {
      scope.post('/api/v1/jobs').reply(429, {
        success: false,
        message: 'Rate limit exceeded',
        errorCode: 'RATE_LIMIT_ERROR',
      });

      await expect(
        client.submitJobAsync({
          jobType: 'webhook',
          priority: 'NORMAL',
        })
      ).rejects.toThrow(SABError);
    });
  });

  describe('Builder Pattern', () => {
    test('should create client with builder', () => {
      const builtClient = SabClient.builder()
        .baseUrl('http://localhost:8080')
        .apiKey('test-key')
        .tenantId('test-tenant')
        .timeout(30000)
        .retry(3, 1000)
        .build();

      expect(builtClient).toBeInstanceOf(SabClient);
    });

    test('should throw error for missing API key', () => {
      expect(() =>
        SabClient.builder().baseUrl('http://localhost:8080').tenantId('test-tenant').build()
      ).toThrow(SABError);
    });

    test('should throw error for missing tenant ID', () => {
      expect(() =>
        SabClient.builder().baseUrl('http://localhost:8080').apiKey('test-key').build()
      ).toThrow(SABError);
    });
  });
});
