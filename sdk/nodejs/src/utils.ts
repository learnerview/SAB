/**
 * Helper function to format time duration in a human-readable string.
 * @param timeMs time in milliseconds
 * @returns formatted string
 */
export function formatDuration(timeMs: number): string {
  if (timeMs < 1000) {
    return `${Math.round(timeMs)}ms`;
  }

  const seconds = timeMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

/**
 * Alias for formatDuration to match previous API.
 */
export const formatExecutionTime = formatDuration;
export const formatWaitTime = formatDuration;

/**
 * Helper function to format throughput.
 */
export function formatThroughput(throughput: number): string {
  if (throughput < 1) {
    return `${(throughput * 60).toFixed(1)}/min`;
  }

  if (throughput < 60) {
    return `${throughput.toFixed(1)}/s`;
  }

  const perMinute = throughput / 60;
  if (perMinute < 60) {
    return `${perMinute.toFixed(1)}/min`;
  }

  const perHour = perMinute / 60;
  return `${perHour.toFixed(1)}/h`;
}
