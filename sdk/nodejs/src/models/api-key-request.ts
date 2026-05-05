//Request object for creating an API key.

export interface ApiKeyRequest {
  //Label for the API key.

  label: string;
  //Producer/tenant ID.

  producer: string;
  //Whether the key has admin privileges.

  isAdmin?: boolean;
}
//Helper function to create an API key request.

export function createApiKeyRequest(
  label: string,
  producer: string,
  isAdmin: boolean = false
): ApiKeyRequest {
  return {
    label,
    producer,
    isAdmin,
  };
}
//Helper function to create a tenant API key request.

export function createTenantApiKeyRequest(label: string, producer: string): ApiKeyRequest {
  return createApiKeyRequest(label, producer, false);
}
//Helper function to create an admin API key request.

export function createAdminApiKeyRequest(label: string, producer: string): ApiKeyRequest {
  return createApiKeyRequest(label, producer, true);
}
