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
  // The FINERACT_PLUGIN_OIDC_* keys are intentionally left unset here.
  // env() prefers window.__env over import.meta.env, so defining them would
  // pin OIDC off and make the VITE_FINERACT_PLUGIN_OIDC_* build variables
  // unusable outside Docker. Unset, they fall through to those and then to
  // the disabled defaults. Docker still injects them via env.template.js.
})(this)
