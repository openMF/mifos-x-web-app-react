/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import fineract from '@/lib/axios'
import {
  changedConfiguration,
  fetchTwoFactorConfiguration,
  getFineractErrorMessage,
  updateTwoFactorConfiguration,
  type TwoFactorConfiguration as Settings,
} from '@/lib/two-factor'
import { toForm, fromForm, type NumberField, type SettingsForm } from './form'

type Status = 'loading' | 'ready' | 'disabled' | 'failed'

/**
 * System > Two-Factor Authentication: how Fineract delivers one-time codes
 * and how long codes and access tokens last. Fineract only offers these
 * settings while two-factor authentication is on (otherwise the endpoint is
 * not there), so the page says so instead of showing an empty form.
 */
const TwoFactorConfiguration = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()

  const [status, setStatus] = useState<Status>('loading')
  const [current, setCurrent] = useState<Settings | null>(null)
  const [form, setForm] = useState<SettingsForm | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<NumberField, string>>
  >({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    kind: 'success' | 'error'
    text: string
  } | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const settings = await fetchTwoFactorConfiguration(fineract)
      if (!settings) {
        setStatus('disabled')
        return
      }
      setCurrent(settings)
      setForm(toForm(settings))
      setStatus('ready')
    } catch (err) {
      console.error('Failed to load the two-factor configuration', err)
      setMessage({
        kind: 'error',
        text: getFineractErrorMessage(err, t('twoFactorConfig.loadFailed')),
      })
      setStatus('failed')
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const update = <K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K]
  ) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
    setMessage(null)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form || !current) return

    const { settings, invalid } = fromForm(form, current)
    const errors: Partial<Record<NumberField, string>> = {}
    for (const field of invalid) {
      errors[field] = t('twoFactorConfig.positiveWholeNumber')
    }
    setFieldErrors(errors)
    if (invalid.length > 0) return

    const changes = changedConfiguration(current, settings)
    if (Object.keys(changes).length === 0) {
      setMessage({ kind: 'success', text: t('twoFactorConfig.noChanges') })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await updateTwoFactorConfiguration(fineract, changes)
      setCurrent(settings)
      setForm(toForm(settings))
      setMessage({ kind: 'success', text: t('twoFactorConfig.saved') })
    } catch (err) {
      console.error('Failed to save the two-factor configuration', err)
      setMessage({
        kind: 'error',
        text: getFineractErrorMessage(err, t('twoFactorConfig.saveFailed')),
      })
    } finally {
      setSaving(false)
    }
  }

  const numberInput = (field: NumberField, label: string, hint?: string) => (
    <div className="flex flex-col gap-1">
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        inputMode="numeric"
        value={form?.[field] ?? ''}
        onChange={e => update(field, e.target.value)}
        aria-invalid={!!fieldErrors[field]}
        className="dark:bg-zinc-700"
      />
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {fieldErrors[field] && (
        <p className="text-xs text-red-500">{fieldErrors[field]}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-4xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('twoFactorConfig.home'), href: '/home' },
          { label: t('twoFactorConfig.system'), href: '/system' },
          { label: t('twoFactorConfig.title'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6 p-6">
        <h1 className="text-xl font-semibold mb-1">
          {t('twoFactorConfig.title')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          {t('twoFactorConfig.description')}
        </p>

        {status === 'loading' && <p>{t('twoFactorConfig.loading')}</p>}

        {status === 'disabled' && (
          <p className="text-sm">{t('twoFactorConfig.notEnabled')}</p>
        )}

        {status === 'failed' && (
          <Button variant="outline" onClick={load}>
            {t('twoFactorConfig.retry')}
          </Button>
        )}

        {status === 'ready' && form && (
          <form onSubmit={save} className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {t('twoFactorConfig.emailSection')}
                </h2>
                <div className="flex items-center gap-2">
                  <Label htmlFor="otp-delivery-email-enable">
                    {t('twoFactorConfig.enabled')}
                  </Label>
                  <Switch
                    id="otp-delivery-email-enable"
                    checked={form['otp-delivery-email-enable']}
                    onCheckedChange={v =>
                      update('otp-delivery-email-enable', v)
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="otp-delivery-email-subject">
                  {t('twoFactorConfig.emailSubject')}
                </Label>
                <Input
                  id="otp-delivery-email-subject"
                  value={form['otp-delivery-email-subject']}
                  onChange={e =>
                    update('otp-delivery-email-subject', e.target.value)
                  }
                  className="dark:bg-zinc-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="otp-delivery-email-body">
                  {t('twoFactorConfig.emailBody')}
                </Label>
                <Textarea
                  id="otp-delivery-email-body"
                  rows={4}
                  value={form['otp-delivery-email-body']}
                  onChange={e =>
                    update('otp-delivery-email-body', e.target.value)
                  }
                  className="dark:bg-zinc-700"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('twoFactorConfig.placeholders')}
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {t('twoFactorConfig.smsSection')}
                </h2>
                <div className="flex items-center gap-2">
                  <Label htmlFor="otp-delivery-sms-enable">
                    {t('twoFactorConfig.enabled')}
                  </Label>
                  <Switch
                    id="otp-delivery-sms-enable"
                    checked={form['otp-delivery-sms-enable']}
                    onCheckedChange={v => update('otp-delivery-sms-enable', v)}
                  />
                </div>
              </div>
              {numberInput(
                'otp-delivery-sms-provider',
                t('twoFactorConfig.smsProvider'),
                t('twoFactorConfig.smsProviderHint')
              )}
              <div className="flex flex-col gap-1">
                <Label htmlFor="otp-delivery-sms-text">
                  {t('twoFactorConfig.smsText')}
                </Label>
                <Textarea
                  id="otp-delivery-sms-text"
                  rows={2}
                  value={form['otp-delivery-sms-text']}
                  onChange={e =>
                    update('otp-delivery-sms-text', e.target.value)
                  }
                  className="dark:bg-zinc-700"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('twoFactorConfig.placeholders')}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h2 className="font-semibold md:col-span-2">
                {t('twoFactorConfig.tokensSection')}
              </h2>
              {numberInput('otp-token-length', t('twoFactorConfig.codeLength'))}
              {numberInput(
                'otp-token-live-time',
                t('twoFactorConfig.codeLifetime'),
                t('twoFactorConfig.inSeconds')
              )}
              {numberInput(
                'access-token-live-time',
                t('twoFactorConfig.tokenLifetime'),
                t('twoFactorConfig.inSeconds')
              )}
              {numberInput(
                'access-token-live-time-extended',
                t('twoFactorConfig.extendedTokenLifetime'),
                t('twoFactorConfig.extendedHint')
              )}
            </section>

            {message && (
              <p
                role={message.kind === 'error' ? 'alert' : 'status'}
                className={
                  message.kind === 'error'
                    ? 'text-sm text-red-500'
                    : 'text-sm text-green-600 dark:text-green-400'
                }
              >
                {message.text}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/system')}
                disabled={saving}
              >
                {t('twoFactorConfig.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {saving
                  ? t('twoFactorConfig.saving')
                  : t('twoFactorConfig.save')}
              </Button>
            </div>
          </form>
        )}

        {status !== 'ready' && message && (
          <p role="alert" className="text-sm text-red-500 mt-4">
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}

export default TwoFactorConfiguration
