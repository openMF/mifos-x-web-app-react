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
import type { SignInFailure } from '@/lib/oidc-users-api'

interface OidcLoginButtonProps {
  /** Why the /callback route sent the user back, if it did. */
  callbackError?: SignInFailure
}

const CALLBACK_MESSAGES = {
  failed: 'login.ssoError',
  rejected: 'login.ssoRejected',
  notProvisioned: 'login.ssoNotProvisioned',
  passwordExpired: 'login.ssoPasswordExpired',
  twoFactor: 'login.ssoTwoFactor',
} as const satisfies Record<SignInFailure, string>

/**
 * Starts the OIDC authorization code flow.
 *
 * Rendered only when OIDC is enabled, since useAuth() requires the provider
 * from App.tsx to be mounted.
 */
const OidcLoginButton = ({ callbackError }: OidcLoginButtonProps) => {
  const auth = useAuth()
  const { t } = useTranslation('auth')

  // Owns the whole SSO error surface so a failed callback, which can set both
  // auth.error and the navigation state, does not render the message twice.
  // The callback's reason is the more specific of the two.
  const errorKey = callbackError
    ? CALLBACK_MESSAGES[callbackError]
    : auth.error
      ? CALLBACK_MESSAGES.failed
      : null

  return (
    <>
      {/* react-oidc-context resolves signinRedirect() with null on failure and
          records the reason on auth.error, so it cannot be caught here. */}
      {errorKey && (
        <p role="alert" className="text-red-500 text-sm mt-4">
          {t(errorKey)}
        </p>
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
