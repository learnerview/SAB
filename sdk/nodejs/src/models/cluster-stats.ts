import { MemoryInfo, CpuInfo } from './common';
//Cluster statistics information.

export interface ClusterStats {
  //Total number of jobs in the system.

  totalJobs?: number;
  //Number of currently running jobs.

  runningJobs?: number;
  //Number of queued jobs.

  queuedJobs?: number;
  //Number of successfully completed jobs.

  successfulJobs?: number;
  //Number of failed jobs.

  failedJobs?: number;
  //Number of jobs in dead letter queue.

  dlqJobs?: number;
  //Number of active workers.

  activeWorkers?: number;
  //Number of active schedules.

  activeSchedules?: number;
  //System uptime in milliseconds.

  uptimeMs?: number;
  //Memory usage information.

  memory?: MemoryInfo;
  //CPU usage information.

  cpu?: CpuInfo;
}
//Helper function to calculate job success rate.

export function getJobSuccessRate(stats: ClusterStats): number | null {
  const { successfulJobs = 0, failedJobs = 0 } = stats;
  const total = successfulJobs + failedJobs;

  if (total === 0) {
    return null;
  }

  return (successfulJobs / total) * 100;
}
//Helper function to calculate job failure rate.

export function getJobFailureRate(stats: ClusterStats): number | null {
  const { successfulJobs = 0, failedJobs = 0 } = stats;
  const total = successfulJobs + failedJobs;

  if (total === 0) {
    return null;
  }

  return (failedJobs / total) * 100;
}
//Helper function to get system health status.

export function getSystemHealth(stats: ClusterStats): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
  const successRate = getJobSuccessRate(stats);
  const memoryUsage = stats.memory?.usagePercentage || 0;
  const cpuUsage = stats.cpu?.usagePercentage || 0;
  // Critical conditions
  if (memoryUsage > 90 || cpuUsage > 90 || (successRate !== null && successRate < 80)) {
    return 'CRITICAL';
  }
  // Warning conditions
  if (memoryUsage > 70 || cpuUsage > 70 || (successRate !== null && successRate < 90)) {
    return 'WARNING';
  }

  return 'HEALTHY';
}
//Helper function to format uptime.

export function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}
