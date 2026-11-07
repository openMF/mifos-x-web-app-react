/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useAuth } from 'react-oidc-context'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface OidcLoginButtonProps {
  /** Set when the /callback route sent the user back after a failed exchange. */
  callbackFailed?: boolean
}

/**
 * Starts the OIDC authorization code flow.
 *
 * Rendered only when OIDC is enabled, since useAuth() requires the provider
 * from App.tsx to be mounted.
 */
const OidcLoginButton = ({ callbackFailed }: OidcLoginButtonProps) => {
  const auth = useAuth()
  const { t } = useTranslation('auth')

  // Owns the whole SSO error surface so a failed callback, which sets both
  // auth.error and the navigation flag, does not render the message twice.
  const showError = !!auth.error || !!callbackFailed

  return (
    <>
      {/* react-oidc-context resolves signinRedirect() with null on failure and
          records the reason on auth.error, so it cannot be caught here. */}
      {showError && (
        <p className="text-red-500 text-sm mt-4">{t('login.ssoError')}</p>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full max-w-xs mt-4 text-base cursor-pointer"
        disabled={auth.isLoading}
        onClick={() => void auth.signinRedirect()}
      >
        {t('login.sso')}
      </Button>
    </>
  )
}

export default OidcLoginButton
