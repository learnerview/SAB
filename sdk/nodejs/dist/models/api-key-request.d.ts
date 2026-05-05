export interface ApiKeyRequest {
    label: string;
    producer: string;
    isAdmin?: boolean;
}
export declare function createApiKeyRequest(label: string, producer: string, isAdmin?: boolean): ApiKeyRequest;
export declare function createTenantApiKeyRequest(label: string, producer: string): ApiKeyRequest;
export declare function createAdminApiKeyRequest(label: string, producer: string): ApiKeyRequest;
//# sourceMappingURL=api-key-request.d.ts.map