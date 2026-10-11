/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  PasswordPreferencesApi,
  type GetPasswordPreferencesTemplateResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const passwordPreferencesApi = new PasswordPreferencesApi(getConfiguration())

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** Display names for the policy keys, as the Angular web app shows them */
const POLICY_LABELS: Record<string, string> = {
  simple: 'Simple',
  secure: 'Secure',
  strong: 'Strong',
}

/**
 * Organization > Password Preferences: pick the password validation policy
 * (GET /passwordpreferences/template, PUT /passwordpreferences).
 */
const PasswordPreferences = () => {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<
    GetPasswordPreferencesTemplateResponse[]
  >([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await passwordPreferencesApi.template21()
        const list = res.data ?? []
        setPolicies(list)
        const active = list.find(policy => policy.active)
        setSelected(active?.id?.toString() ?? '')
      } catch (err) {
        console.error('Failed to fetch password preferences', err)
        setError('Failed to load password preferences.')
      } finally {
        setLoading(false)
      }
    }
    fetchPolicies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) {
      setError('Please select a password policy.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await passwordPreferencesApi.update25({
        validationPolicyId: Number(selected),
      })
      navigate('/organization')
    } catch (err) {
      const data = (err as AxiosError<ApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          'Failed to update password preferences.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Password Preferences', current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mb-4">Password Preferences</h1>

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <RadioGroup value={selected} onValueChange={setSelected}>
              {policies.map(policy => {
                const id = policy.id?.toString() ?? ''
                return (
                  <div
                    key={id}
                    className="flex items-start gap-3 rounded-md border border-zinc-200 dark:border-zinc-700 p-4"
                  >
                    <RadioGroupItem
                      id={`policy-${id}`}
                      value={id}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor={`policy-${id}`}
                        className="text-base font-semibold cursor-pointer"
                      >
                        {POLICY_LABELS[policy.key ?? ''] ?? policy.key}
                      </Label>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {policy.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/organization')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
                disabled={!selected || submitting}
              >
                Submit
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PasswordPreferences
