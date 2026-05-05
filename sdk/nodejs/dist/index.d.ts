export { SabClient } from './client';
export { SABConfig } from './config';
export { SABError } from './error';
export * from './models';
export * from './services';
export * from './types';
export * from './utils';
/**
 * SAB Node.js SDK
 *
 * A TypeScript/JavaScript SDK for interacting with the SAB job scheduling platform.
 *
 * @example
 * ```typescript
 * import { SabClient } from '@learnerview/sab-sdk';
 *
 * const client = SabClient.builder()
 *   .baseUrl('http://localhost:8080')
 *   .apiKey('your-api-key')
 *   .tenantId('your-tenant-id')
 *   .build();
 *
 * // Submit a job
 * const job = await client.submitJobAsync({
 *   jobType: 'webhook',
 *   priority: 'NORMAL',
 *   payload: { message: 'Hello World' },
 *   execution: {
 *     type: 'HTTP',
 *     endpoint: 'https://example.com/webhook',
 *     timeoutSeconds: 30
 *   }
 * });
 *
 * console.log('Job submitted:', job.jobId);
 * ```
 */
//# sourceMappingURL=index.d.ts.map