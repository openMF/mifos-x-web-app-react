/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import {
  ProvisioningCriteriaApi,
  ProvisioningEntriesApi,
  type GetProvisioningCriteriaResponse,
} from '@/fineract-api'
import type { AxiosError } from 'axios'
import { getConfiguration } from '@/lib/fineract-openapi'

const provisioningEntriesApi = new ProvisioningEntriesApi(getConfiguration())
const provisioningCriteriaApi = new ProvisioningCriteriaApi(getConfiguration())

const CreateProvisioningEntry = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    date: '',
    createJournalEntries: false,
  })
  const [criteria, setCriteria] = useState<GetProvisioningCriteriaResponse[]>(
    []
  )
  const [criteriaLoading, setCriteriaLoading] = useState(true)
  const [criteriaError, setCriteriaError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setCriteriaLoading(true)
        const res =
          await provisioningCriteriaApi.retrieveAllProvisioningCriterias()
        if (cancelled) return
        setCriteria(res.data || [])
        setCriteriaError(null)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch provisioning criteria', err)
        setCriteria([])
        setCriteriaError('Unable to load provisioning criteria.')
      } finally {
        if (!cancelled) setCriteriaLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date) {
      alert('Please select a date.')
      return
    }
    if (criteria.length === 0) {
      alert('No provisioning criteria definitions are found.')
      return
    }

    const formattedDate = new Date(formData.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    try {
      await provisioningEntriesApi.createProvisioningEntries({
        date: formattedDate,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en',
        createjournalentries: formData.createJournalEntries,
      })
      alert('Provisioning entry created successfully!')
      navigate('/accounting/provisioning-entries')
    } catch (err) {
      const axiosError = err as AxiosError<{
        defaultUserMessage?: string
        errors?: Array<{ defaultUserMessage?: string }>
      }>
      const responseMessage =
        axiosError.response?.data?.errors?.[0]?.defaultUserMessage ||
        axiosError.response?.data?.defaultUserMessage
      console.error('Failed to create provisioning entry', err)
      alert(responseMessage || 'Failed to create provisioning entry')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          {
            label: 'Provisioning Entries',
            href: '/accounting/provisioning-entries',
          },
          { label: 'Create', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          Create Provisioning Entry
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="w-full space-y-2">
            <Label>Date*</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={e =>
                setFormData(prev => ({ ...prev, date: e.target.value }))
              }
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="create-journal-entries"
              checked={formData.createJournalEntries}
              onCheckedChange={value =>
                setFormData(prev => ({
                  ...prev,
                  createJournalEntries: value === true,
                }))
              }
            />
            <Label htmlFor="create-journal-entries">
              Create journal entries
            </Label>
          </div>

          {criteriaError && (
            <div className="text-sm text-red-600">{criteriaError}</div>
          )}
          {!criteriaLoading && !criteriaError && criteria.length === 0 && (
            <div className="text-sm text-zinc-600">
              No provisioning criteria definitions are found.
            </div>
          )}

          <div className="flex justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting/provisioning-entries')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={criteriaLoading || criteria.length === 0}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProvisioningEntry
