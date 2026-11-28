/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAppDispatch } from '@/app/hook'
import fineract from '@/lib/axios'
import {
  getTenantId,
  hasSession,
  needsTwoFactorVerification,
} from '@/lib/http-client'
import {
  fetchDeliveryMethods,
  getPendingVerification,
  isOtpInvalidError,
  requestOtp,
  returnPath,
  validateOtp,
  verificationFromStoredSession,
  type DeliveryMethod,
  type PendingVerification,
} from '@/lib/two-factor'
import { requestSharedTwoFactorToken } from '@/lib/two-factor-sync'
import { completeTwoFactor, logout } from '@/pages/login/loginSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTheme } from '@/hooks/use-theme'
import mifosLogoLight from '@/assets/images/mifos_lg-logo.png'
import mifosLogoDark from '@/assets/images/image-removebg-preview-transparent.png'

/** Seconds before another code can be sent. */
const RESEND_COOLDOWN_SECONDS = 30

type Step = 'loading' | 'choose' | 'enter' | 'unavailable'

/** The verification this page is for: a sign-in, or a session to resume. */
const initialVerification = (): PendingVerification | null =>
  getPendingVerification() ??
  (needsTwoFactorVerification() ? verificationFromStoredSession() : null)

/**
 * The second step of signing in when Fineract has two-factor authentication
 * on: the user picks where to get a one-time code, then enters it. Also
 * shown when the access token of a running session expires, so the user can
 * carry on without signing in again.
 */
const TwoFactorVerify = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isDark } = useTheme()

  // Read once: finishing clears the pending verification.
  const [verification] = useState(initialVerification)
  // Sent here by the route guard (no pending verification): another tab of
  // this browser session may still hold a valid token. Never after Fineract
  // refused a token, which the other tabs would only hand back.
  const [askOtherTabs] = useState(() => !getPendingVerification())
  const [step, setStep] = useState<Step>('loading')
  const [methods, setMethods] = useState<DeliveryMethod[]>([])
  const [method, setMethod] = useState('')
  const [sentTo, setSentTo] = useState<DeliveryMethod | null>(null)
  const [codeMinutes, setCodeMinutes] = useState<number | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const codeInput = useRef<HTMLInputElement>(null)

  /** Requests go to the tenant last chosen in any tab; never another one. */
  const tenantChanged = () =>
    !!verification && getTenantId() !== verification.tenant

  useEffect(() => {
    if (!verification) return
    let cancelled = false

    const load = async () => {
      if (getTenantId() !== verification.tenant) {
        setError(t('twoFactor.tenantChanged', { tenant: verification.tenant }))
        setStep('unavailable')
        return
      }
      if (
        verification.reason === 'expired' &&
        askOtherTabs &&
        (await requestSharedTwoFactorToken())
      ) {
        if (!cancelled) {
          navigate(returnPath(location.state), { replace: true })
        }
        return
      }
      try {
        const found = await fetchDeliveryMethods(fineract, verification.authKey)
        if (cancelled) return
        if (found.length === 0) {
          setError(t('twoFactor.noMethods'))
          setStep('unavailable')
          return
        }
        setMethods(found)
        setMethod(found[0].name)
        setStep('choose')
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load the two-factor delivery methods', err)
        setError(t('twoFactor.loadFailed'))
        setStep('unavailable')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [verification, askOtherTabs, navigate, location.state, t])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    if (step === 'enter') codeInput.current?.focus()
  }, [step])

  if (!verification) {
    // Opened directly, or reloaded mid sign-in, which drops the in-memory
    // credential on purpose.
    return <Navigate to={hasSession() ? '/home' : '/login'} replace />
  }

  const sendCode = async () => {
    if (tenantChanged()) {
      setError(t('twoFactor.tenantChanged', { tenant: verification.tenant }))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const sent = await requestOtp(
        fineract,
        verification.authKey,
        method,
        verification.rememberMe
      )
      setSentTo(
        sent?.deliveryMethod ?? methods.find(m => m.name === method) ?? null
      )
      setCodeMinutes(
        sent?.tokenLiveTimeInSec
          ? Math.max(1, Math.round(sent.tokenLiveTimeInSec / 60))
          : null
      )
      setCode('')
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setStep('enter')
    } catch (err) {
      console.error('Failed to send the one-time code', err)
      setError(t('twoFactor.sendFailed'))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (event: React.FormEvent) => {
    event.preventDefault()
    // Fineract's codes are upper-case letters and digits.
    const entered = code.trim().toUpperCase()
    if (!entered) {
      setError(t('twoFactor.codeRequired'))
      return
    }
    if (tenantChanged()) {
      setError(t('twoFactor.tenantChanged', { tenant: verification.tenant }))
      return
    }

    setBusy(true)
    setError(null)
    try {
      const accessToken = await validateOtp(
        fineract,
        verification.authKey,
        entered
      )
      const result = await dispatch(
        completeTwoFactor({ verification, accessToken })
      )
      if (completeTwoFactor.fulfilled.match(result)) {
        navigate(
          verification.reason === 'expired'
            ? returnPath(location.state)
            : '/home',
          { replace: true }
        )
        return
      }
      setError(t('twoFactor.sessionChanged'))
    } catch (err) {
      if (isOtpInvalidError(err)) {
        setError(t('twoFactor.invalidCode'))
      } else {
        console.error('Failed to check the one-time code', err)
        setError(t('twoFactor.verifyFailed'))
      }
    } finally {
      setBusy(false)
    }
  }

  const leave = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const methodLabel = (name: string) =>
    t(`twoFactor.methods.${name}`, { defaultValue: name })

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white dark:bg-zinc-800 shadow-md p-8 flex flex-col items-center">
        <img
          src={isDark ? mifosLogoDark : mifosLogoLight}
          alt="mifosLogo"
          className="h-[90px] mb-6"
        />
        <h1 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white text-center">
          {verification.reason === 'expired'
            ? t('twoFactor.expiredTitle')
            : t('twoFactor.title')}
        </h1>
        <p className="text-sm text-center mb-6 text-zinc-700 dark:text-zinc-300">
          {verification.reason === 'expired'
            ? t('twoFactor.expiredDescription', {
                username: verification.username,
              })
            : t('twoFactor.description', { username: verification.username })}
        </p>

        {step === 'loading' && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('twoFactor.loading')}
          </p>
        )}

        {step === 'choose' && (
          <div className="w-full flex flex-col gap-4">
            <Label className="text-zinc-900 dark:text-white">
              {t('twoFactor.chooseMethod')}
            </Label>
            <RadioGroup
              value={method}
              onValueChange={setMethod}
              className="gap-3"
              aria-label={t('twoFactor.chooseMethod')}
            >
              {methods.map(option => (
                <div key={option.name} className="flex items-center gap-3">
                  <RadioGroupItem
                    value={option.name}
                    id={`otp-method-${option.name}`}
                  />
                  <Label
                    htmlFor={`otp-method-${option.name}`}
                    className="font-normal text-zinc-800 dark:text-zinc-200"
                  >
                    {methodLabel(option.name)}{' '}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      ({option.target})
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button
              type="button"
              onClick={sendCode}
              disabled={busy || !method}
              className="w-full bg-sky-600 hover:bg-sky-700 cursor-pointer"
            >
              {busy ? t('twoFactor.sending') : t('twoFactor.sendCode')}
            </Button>
          </div>
        )}

        {step === 'enter' && (
          <form onSubmit={verify} className="w-full flex flex-col gap-4">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {sentTo
                ? t('twoFactor.codeSent', { target: sentTo.target })
                : t('twoFactor.codeSentGeneric')}{' '}
              {codeMinutes !== null &&
                t('twoFactor.codeValidity', { count: codeMinutes })}
            </p>
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="otp-code"
                className="text-zinc-900 dark:text-white"
              >
                {t('twoFactor.code')}
              </Label>
              <Input
                id="otp-code"
                ref={codeInput}
                value={code}
                onChange={e => setCode(e.target.value)}
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={32}
                className="dark:bg-zinc-700 dark:text-white tracking-widest"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-sky-600 hover:bg-sky-700 cursor-pointer"
            >
              {busy ? t('twoFactor.verifying') : t('twoFactor.verify')}
            </Button>
            <div className="flex flex-wrap justify-between gap-2">
              <Button
                type="button"
                variant="link"
                className="px-0"
                disabled={busy || cooldown > 0}
                onClick={sendCode}
              >
                {cooldown > 0
                  ? t('twoFactor.resendIn', { count: cooldown })
                  : t('twoFactor.resend')}
              </Button>
              {methods.length > 1 && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  disabled={busy}
                  onClick={() => {
                    setError(null)
                    setStep('choose')
                  }}
                >
                  {t('twoFactor.otherMethod')}
                </Button>
              )}
            </div>
          </form>
        )}

        {error && (
          <p role="alert" className="text-red-500 text-sm mt-4 text-center">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="ghost"
          className="mt-4 cursor-pointer"
          disabled={busy}
          onClick={leave}
        >
          {verification.reason === 'expired'
            ? t('twoFactor.signOut')
            : t('twoFactor.backToSignIn')}
        </Button>
      </div>
    </div>
  )
}

export default TwoFactorVerify
