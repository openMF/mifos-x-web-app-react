;(function (window) {
  window.__env = window.__env || {}

  // API Configuration (defaults for local development)
  // Empty string = relative URLs (requests go through Vite proxy or nginx)
  window.__env.FINERACT_API_URL = ''
  window.__env.FINERACT_API_PROVIDER = '/fineract-provider'
  window.__env.FINERACT_API_VERSION = '/api'
  window.__env.FINERACT_PLATFORM_TENANT_IDENTIFIER = 'default'

  // Language & Locale
  window.__env.MIFOS_DEFAULT_LANGUAGE = 'en-US'
  window.__env.MIFOS_SUPPORTED_LANGUAGES =
    'cs-CS,de-DE,en-US,es-MX,fr-FR,it-IT,ko-KO,li-LI,lv-LV,ne-NE,pt-PT,sw-SW'

  // Feature Flags
  window.__env.MIFOS_PRELOAD_CLIENTS = 'true'
  window.__env.MIFOS_DEFAULT_CHAR_DELIMITER = ','

  // OAuth / OIDC (disabled by default for local dev)
  window.__env.MIFOS_OAUTH_SERVER_ENABLED = 'false'
  window.__env.FINERACT_PLUGIN_OIDC_ENABLED = 'false'
  window.__env.FINERACT_PLUGIN_OIDC_BASE_URL = ''
  window.__env.FINERACT_PLUGIN_OIDC_CLIENT_ID = ''
  window.__env.FINERACT_PLUGIN_OIDC_API_URL = ''
  window.__env.FINERACT_PLUGIN_OIDC_FRONTEND_URL = ''
})(this)
