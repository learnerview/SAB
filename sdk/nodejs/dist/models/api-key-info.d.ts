export interface ApiKeyInfo {
    id: string;
    label: string;
    producer: string;
    apiKey?: string;
    isAdmin?: boolean;
    createdAt?: string;
    lastUsedAt?: string;
    active?: boolean;
}
export declare function isAdminKey(keyInfo: ApiKeyInfo): boolean;
export declare function isKeyActive(keyInfo: ApiKeyInfo): boolean;
export declare function getKeyAge(keyInfo: ApiKeyInfo): number | null;
export declare function getTimeSinceLastUse(keyInfo: ApiKeyInfo): number | null;
export declare function formatKeyAge(keyInfo: ApiKeyInfo): string;
export declare function formatLastUsed(keyInfo: ApiKeyInfo): string;
export declare function isRecentlyUsed(keyInfo: ApiKeyInfo): boolean;
export declare function isStaleKey(keyInfo: ApiKeyInfo): boolean;
export declare function getKeyStatus(keyInfo: ApiKeyInfo): {
    active: boolean;
    admin: boolean;
    recentlyUsed: boolean;
    stale: boolean;
    age: string;
    lastUsed: string;
};
//# sourceMappingURL=api-key-info.d.ts.map