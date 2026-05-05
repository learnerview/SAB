//Job health information.

export interface JobHealth {
  //Number of queued jobs.

  queued?: number;
  //Number of running jobs.

  running?: number;
  //Number of successful jobs.

  success?: number;
  //Number of failed jobs.

  failed?: number;
  //Number of jobs in dead letter queue.

  dlq?: number;
  //Job success rate percentage.

  successRate?: number;
  //Average job execution time in milliseconds.

  avgExecutionTimeMs?: number;
  //Average job wait time in milliseconds.

  avgWaitTimeMs?: number;
  //Throughput (jobs per second).

  throughput?: number;
}
//Helper function to calculate total jobs processed.

export function getTotalProcessed(health: JobHealth): number {
  return (health.success || 0) + (health.failed || 0) + (health.dlq || 0);
}
//Helper function to calculate success rate.

export function calculateSuccessRate(health: JobHealth): number | null {
  const { success = 0, failed = 0, dlq = 0 } = health;
  const total = success + failed + dlq;

  if (total === 0) {
    return null;
  }

  return (success / total) * 100;
}
//Helper function to calculate failure rate.

export function calculateFailureRate(health: JobHealth): number | null {
  const { success = 0, failed = 0, dlq = 0 } = health;
  const total = success + failed + dlq;

  if (total === 0) {
    return null;
  }

  return ((failed + dlq) / total) * 100;
}
//Helper function to get health status.

export function getHealthStatus(health: JobHealth): 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'IDLE' {
  const totalProcessed = getTotalProcessed(health);
  const queued = health.queued || 0;
  const running = health.running || 0;
  const successRate = calculateSuccessRate(health);
  const waitTime = health.avgWaitTimeMs || 0;
  // Idle state
  if (totalProcessed === 0 && queued === 0 && running === 0) {
    return 'IDLE';
  }
  // Critical conditions
  if (waitTime > 300000 || queued > 1000 || (successRate !== null && successRate < 80)) {
    return 'CRITICAL';
  }
  // Warning conditions
  if (waitTime > 120000 || queued > 500 || (successRate !== null && successRate < 90)) {
    return 'WARNING';
  }

  return 'HEALTHY';
}
import { formatExecutionTime, formatWaitTime, formatThroughput } from '../utils';
//Helper function to get health summary.

export function getHealthSummary(health: JobHealth): {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'IDLE';
  totalProcessed: number;
  successRate: number | null;
  failureRate: number | null;
  formattedExecutionTime: string;
  formattedWaitTime: string;
  formattedThroughput: string;
} {
  return {
    status: getHealthStatus(health),
    totalProcessed: getTotalProcessed(health),
    successRate: calculateSuccessRate(health),
    failureRate: calculateFailureRate(health),
    formattedExecutionTime: formatExecutionTime(health.avgExecutionTimeMs || 0),
    formattedWaitTime: formatWaitTime(health.avgWaitTimeMs || 0),
    formattedThroughput: formatThroughput(health.throughput || 0),
  };
}
