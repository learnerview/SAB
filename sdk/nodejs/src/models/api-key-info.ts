//API key information.

export interface ApiKeyInfo {
  //API key ID.

  id: string;
  //API key label.

  label: string;
  //Producer/tenant ID.

  producer: string;
  //API key value (only returned on creation).

  apiKey?: string;
  //Whether the key has admin privileges.

  isAdmin?: boolean;
  //Key creation timestamp (ISO string).

  createdAt?: string;
  //Key last used timestamp (ISO string).

  lastUsedAt?: string;
  //Whether the key is active.

  active?: boolean;
}
//Helper function to check if API key is admin.

export function isAdminKey(keyInfo: ApiKeyInfo): boolean {
  return keyInfo.isAdmin === true;
}
//Helper function to check if API key is active.

export function isKeyActive(keyInfo: ApiKeyInfo): boolean {
  return keyInfo.active !== false; // Default to active if not specified
}
//Helper function to get key age in milliseconds.

export function getKeyAge(keyInfo: ApiKeyInfo): number | null {
  if (!keyInfo.createdAt) {
    return null;
  }

  const createdAt = new Date(keyInfo.createdAt).getTime();
  return Date.now() - createdAt;
}
//Helper function to get time since last use in milliseconds.

export function getTimeSinceLastUse(keyInfo: ApiKeyInfo): number | null {
  if (!keyInfo.lastUsedAt) {
    return null;
  }

  const lastUsedAt = new Date(keyInfo.lastUsedAt).getTime();
  return Date.now() - lastUsedAt;
}
//Helper function to format key age.

export function formatKeyAge(keyInfo: ApiKeyInfo): string {
  const age = getKeyAge(keyInfo);
  if (age === null) {
    return 'Unknown';
  }

  const minutes = Math.floor(age / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ago`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ago`;
  }

  return 'Just now';
}
//Helper function to format last used time.

export function formatLastUsed(keyInfo: ApiKeyInfo): string {
  const timeSince = getTimeSinceLastUse(keyInfo);
  if (timeSince === null) {
    return 'Never';
  }

  const minutes = Math.floor(timeSince / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ago`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ago`;
  }

  return 'Just now';
}
//Helper function to check if key is recently used (within last hour).

export function isRecentlyUsed(keyInfo: ApiKeyInfo): boolean {
  const timeSince = getTimeSinceLastUse(keyInfo);
  return timeSince !== null && timeSince < 60 * 60 * 1000; // 1 hour
}
//Helper function to check if key is stale (not used in last 30 days).

export function isStaleKey(keyInfo: ApiKeyInfo): boolean {
  const timeSince = getTimeSinceLastUse(keyInfo);
  return timeSince !== null && timeSince > 30 * 24 * 60 * 60 * 1000; // 30 days
}
//Helper function to get key status summary.

export function getKeyStatus(keyInfo: ApiKeyInfo): {
  active: boolean;
  admin: boolean;
  recentlyUsed: boolean;
  stale: boolean;
  age: string;
  lastUsed: string;
} {
  return {
    active: isKeyActive(keyInfo),
    admin: isAdminKey(keyInfo),
    recentlyUsed: isRecentlyUsed(keyInfo),
    stale: isStaleKey(keyInfo),
    age: formatKeyAge(keyInfo),
    lastUsed: formatLastUsed(keyInfo),
  };
}
