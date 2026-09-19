/**
 * Runtime environment configuration.
 *
 * Resolution order:
 *   1. Docker runtime  – window.__env (injected via envsubst in env.js)
 *   2. Vite build-time – import.meta.env.VITE_*
 *   3. Hard-coded defaults
 */

interface EnvWindow {
  __env?: Record<string, string>
}

function env(runtimeKey: string, viteKey: string, fallback: string): string {
  const runtime = (window as unknown as EnvWindow).__env?.[runtimeKey]
  // envsubst leaves "${VAR}" literally when the var is unset — treat that as empty
  if (runtime != null && !runtime.startsWith('${')) return runtime

  const vite = (import.meta.env as Record<string, string>)?.[viteKey]
  if (vite) return vite

  return fallback
}

export const envConfig = {
  /** Base URL of the Fineract server (protocol + host + port) */
  apiUrl: env(
    'FINERACT_API_URL',
    'VITE_FINERACT_API_URL',
    'https://localhost:8443'
  ),

  /** API path prefix */
  apiProvider: env(
    'FINERACT_API_PROVIDER',
    'VITE_FINERACT_API_PROVIDER',
    '/fineract-provider'
  ),

  /** API version path */
  apiVersion: env('FINERACT_API_VERSION', 'VITE_FINERACT_API_VERSION', '/api'),

  /** Tenant identifier for multi-tenant setups */
  tenantId: env(
    'FINERACT_PLATFORM_TENANT_IDENTIFIER',
    'VITE_FINERACT_PLATFORM_TENANT_IDENTIFIER',
    'default'
  ),

  /** Whether OIDC authentication is enabled */
  oidcEnabled:
    env(
      'FINERACT_PLUGIN_OIDC_ENABLED',
      'VITE_FINERACT_PLUGIN_OIDC_ENABLED',
      'false'
    ).toLowerCase() === 'true',

  /** OIDC provider base URL */
  oidcBaseUrl: env(
    'FINERACT_PLUGIN_OIDC_BASE_URL',
    'VITE_FINERACT_PLUGIN_OIDC_BASE_URL',
    ''
  ),

  /** OIDC client ID */
  oidcClientId: env(
    'FINERACT_PLUGIN_OIDC_CLIENT_ID',
    'VITE_FINERACT_PLUGIN_OIDC_CLIENT_ID',
    ''
  ),

  /** OIDC API URL */
  oidcApiUrl: env(
    'FINERACT_PLUGIN_OIDC_API_URL',
    'VITE_FINERACT_PLUGIN_OIDC_API_URL',
    ''
  ),

  /** OIDC frontend URL */
  oidcFrontendUrl: env(
    'FINERACT_PLUGIN_OIDC_FRONTEND_URL',
    'VITE_FINERACT_PLUGIN_OIDC_FRONTEND_URL',
    ''
  ),

  /** Default UI language */
  defaultLanguage: env('MIFOS_DEFAULT_LANGUAGE', '', 'en-US'),
} as const
