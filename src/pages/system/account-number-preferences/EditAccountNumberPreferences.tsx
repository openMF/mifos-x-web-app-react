/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { AccountNumberFormatApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import AppSelect from '@/components/custom/select/AppSelect'

const accountNumberFormatApi = new AccountNumberFormatApi(getConfiguration())

const EditAccountNumberPreferences = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [accountTypeOptions, setAccountTypeOptions] = useState<
    Array<{ id?: number; code?: string; value?: string }>
  >([])
  const [prefixTypeOptions, setPrefixTypeOptions] = useState<{
    [key: string]: Array<{ id?: number; code?: string; value?: string }>
  }>({})

  // form state
  const [formData, setFormData] = useState({
    accountType: '',
    accountTypeCode: '',
    prefix: '',
  })

  // fetch template for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const templateRes = await accountNumberFormatApi.retrieveTemplate2()
        setAccountTypeOptions(templateRes.data?.accountTypeOptions || [])
        setPrefixTypeOptions(templateRes.data?.prefixTypeOptions || {})

        if (id) {
          const recordRes = await accountNumberFormatApi.retrieveOne(Number(id))
          const record = recordRes.data ?? {}
          const matchedType = (templateRes.data?.accountTypeOptions || []).find(
            o => o.id === record.accountType?.id
          )
          setFormData({
            accountType: record.accountType?.id?.toString() ?? '',
            accountTypeCode: matchedType?.code || '',
            prefix: record.prefixType?.id?.toString() ?? '',
          })
        }
      } catch (err) {
        console.error('Failed to fetch account number preference', err)
      }
    }
    fetchData()
  }, [id])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const availablePrefixOptions = formData.accountTypeCode
    ? prefixTypeOptions[formData.accountTypeCode] || []
    : []

  // update account number preference
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.prefix) {
      alert('Please select a prefix.')
      return
    }

    try {
      await accountNumberFormatApi.update1(Number(id), {
        prefixType: Number(formData.prefix),
      })
      alert('Account Number Preference updated successfully!')
      navigate('/system/account-number-preferences')
    } catch (err) {
      console.error('Failed to update account number preference', err)
      alert('Failed to update account number preference')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          {
            label: 'Account Number Preferences',
            href: '/system/account-number-preferences',
          },
          {
            label: `${id}`,
            href: `/system/account-number-preferences/${id}`,
          },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Account Type (cannot be edited)*/}
          <div className="w-full space-y-2">
            <label className="text-sm font-medium">Account Type</label>
            <div className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {accountTypeOptions.find(
                o => o.id?.toString() === formData.accountType
              )?.value || '—'}
            </div>
          </div>

          {/* Prefix Field */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Prefix Field"
              selectPlaceholder="Select Prefix"
              selectValue={formData.prefix}
              selectOnChange={val => handleChange('prefix', val)}
              selectClassname="w-full space-y-2"
              selectOptions={availablePrefixOptions.map(o => ({
                id: o.id?.toString() || '',
                name: o.value || '',
              }))}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/system/account-number-preferences')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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

export default EditAccountNumberPreferences
