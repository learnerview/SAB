//Queue statistics information.

export interface QueueStats {
  //Number of high priority queued jobs.

  highPriorityQueued?: number;
  //Number of normal priority queued jobs.

  normalPriorityQueued?: number;
  //Number of low priority queued jobs.

  lowPriorityQueued?: number;
  //Total number of queued jobs.

  queued?: number;
  //Number of running jobs.

  running?: number;
  //Number of successfully completed jobs.

  success?: number;
  //Number of failed jobs.

  failed?: number;
  //Number of jobs in dead letter queue.

  dlq?: number;
  //Queue throughput (jobs per second).

  throughput?: number;
  //Average job execution time in milliseconds.

  avgExecutionTimeMs?: number;
  //Average job wait time in milliseconds.

  avgWaitTimeMs?: number;
  //Queue age (oldest job age in milliseconds).

  queueAgeMs?: number;
}
//Helper function to calculate total queued jobs.

export function getTotalQueued(stats: QueueStats): number {
  return (
    (stats.highPriorityQueued || 0) +
    (stats.normalPriorityQueued || 0) +
    (stats.lowPriorityQueued || 0)
  );
}
//Helper function to calculate job success rate.

export function getQueueSuccessRate(stats: QueueStats): number | null {
  const { success = 0, failed = 0 } = stats;
  const total = success + failed;

  if (total === 0) {
    return null;
  }

  return (success / total) * 100;
}
//Helper function to calculate job failure rate.

export function getQueueFailureRate(stats: QueueStats): number | null {
  const { success = 0, failed = 0 } = stats;
  const total = success + failed;

  if (total === 0) {
    return null;
  }

  return (failed / total) * 100;
}
//Helper function to get queue health status.

export function getQueueHealth(stats: QueueStats): 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'IDLE' {
  const totalQueued = getTotalQueued(stats);
  const running = stats.running || 0;
  const successRate = getQueueSuccessRate(stats);
  const queueAge = stats.queueAgeMs || 0;
  // Idle state
  if (totalQueued === 0 && running === 0) {
    return 'IDLE';
  }
  // Critical conditions
  if (queueAge > 300000 || totalQueued > 1000 || (successRate !== null && successRate < 80)) {
    return 'CRITICAL';
  }
  // Warning conditions
  if (queueAge > 120000 || totalQueued > 500 || (successRate !== null && successRate < 90)) {
    return 'WARNING';
  }

  return 'HEALTHY';
}
//Helper function to format queue age.

export function formatQueueAge(queueAgeMs: number): string {
  const seconds = Math.floor(queueAgeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}
//Helper function to get priority distribution.

export function getPriorityDistribution(stats: QueueStats): {
  high: number;
  normal: number;
  low: number;
  percentages: {
    high: number;
    normal: number;
    low: number;
  };
} {
  const high = stats.highPriorityQueued || 0;
  const normal = stats.normalPriorityQueued || 0;
  const low = stats.lowPriorityQueued || 0;
  const total = high + normal + low;

  return {
    high,
    normal,
    low,
    percentages: {
      high: total > 0 ? (high / total) * 100 : 0,
      normal: total > 0 ? (normal / total) * 100 : 0,
      low: total > 0 ? (low / total) * 100 : 0,
    },
  };
}
