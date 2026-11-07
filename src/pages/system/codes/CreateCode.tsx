/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CodesApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const codesApi = new CodesApi(getConfiguration())

type CodesApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** Creates a code (POST /codes), the Create Code page of the Angular web app */
const CreateCode = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a code name.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await codesApi.createCode({ name: trimmed })
      // Land on the new code so its values can be added right away
      const codeId = res.data?.resourceId
      navigate(codeId ? `/system/codes/${codeId}` : '/system/codes')
    } catch (err) {
      const data = (err as AxiosError<CodesApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          'Failed to create code.'
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
          { label: 'System', href: '/system' },
          { label: 'Codes', href: '/system/codes' },
          { label: 'Create Code', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Code</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="w-full space-y-2">
            <Label htmlFor="codeName">Code Name*</Label>
            <Input
              id="codeName"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError(null)
              }}
              required
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/system/codes')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={!name.trim() || submitting}
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCode
