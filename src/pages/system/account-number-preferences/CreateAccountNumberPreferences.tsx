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
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { AccountNumberFormatApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import AppSelect from '@/components/custom/select/AppSelect'

const accountNumberFormatApi = new AccountNumberFormatApi(getConfiguration())

const CreateAccountNumberPreferences = () => {
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

  // template for dropdowns
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await accountNumberFormatApi.retrieveTemplate2()
        setAccountTypeOptions(response.data?.accountTypeOptions || [])
        setPrefixTypeOptions(response.data?.prefixTypeOptions || {})
      } catch (err) {
        console.error('Failed to fetch account number format template', err)
      }
    }
    fetchTemplate()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const availablePrefixOptions = formData.accountTypeCode
    ? prefixTypeOptions[formData.accountTypeCode] || []
    : []

  // submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.accountType) {
      alert('Please select an account type.')
      return
    }
    if (!formData.prefix) {
      alert('Please select a prefix.')
      return
    }

    try {
      await accountNumberFormatApi.create({
        accountType: Number(formData.accountType),
        prefixType: Number(formData.prefix),
      })
      alert('Account Number Preference created successfully!')
      navigate('/system/account-number-preferences')
    } catch (err) {
      console.error('Failed to create account number preference', err)
      alert('Failed to create account number preference')
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
          { label: 'Create', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Account Type Select */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Account Type*"
              selectPlaceholder="Select Account Type"
              selectValue={formData.accountType}
              selectOnChange={val => {
                const selected = accountTypeOptions.find(
                  o => o.id?.toString() === val
                )
                setFormData(prev => ({
                  ...prev,
                  accountType: val,
                  accountTypeCode: selected?.code || '',
                  prefix: '',
                }))
              }}
              selectClassname="w-full space-y-2"
              selectOptions={accountTypeOptions.map(o => ({
                id: o.id?.toString() || '',
                name: o.value || '',
              }))}
            />
          </div>

          {/* Prefix Field Select */}
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

export default CreateAccountNumberPreferences
