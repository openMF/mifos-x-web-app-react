/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import AppSelect from '@/components/custom/select/AppSelect'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { AdhocQueryApiApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const adhocQueryApi = new AdhocQueryApiApi(getConfiguration())

const CreateAdhocQuery = () => {
  const navigate = useNavigate()

  // form state
  const [formData, setFormData] = useState({
    name: '',
    query: '',
    tableName: '',
    tableFields: '',
    email: '',
    reportRunFrequency: '',
    isActive: false,
  })

  // submit handler, create adhoc query via API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adhocQueryApi.createAdHocQuery({
        name: formData.name,
        query: formData.query,
        tableName: formData.tableName,
        tableFields: formData.tableFields,
        email: formData.email || undefined,
        reportRunFrequency: Number(formData.reportRunFrequency) || undefined,
        isActive: formData.isActive,
      })
      navigate('/organization/adhoc-query')
    } catch (err) {
      console.error('Failed to create Adhoc Query', err)
      alert('Failed to create Adhoc Query')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Adhoc Query', href: '/organization/adhoc-query' },
          { label: 'Create', current: true },
        ]}
      />

      {/* Form container */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Adhoc Query</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="space-y-2">
            <Label>Name*</Label>
            <Input
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* SQL Query */}
          <div className="space-y-2">
            <Label>SQL Query*</Label>
            <Input
              value={formData.query}
              onChange={e =>
                setFormData(prev => ({ ...prev, query: e.target.value }))
              }
              required
            />
          </div>

          {/* Table Name */}
          <div className="space-y-2">
            <Label>Insert into table*</Label>
            <Input
              value={formData.tableName}
              onChange={e =>
                setFormData(prev => ({ ...prev, tableName: e.target.value }))
              }
              required
            />
          </div>

          {/* Table Fields */}
          <div className="space-y-2">
            <Label>Table Fields*</Label>
            <Input
              value={formData.tableFields}
              onChange={e =>
                setFormData(prev => ({ ...prev, tableFields: e.target.value }))
              }
              required
            />
          </div>

          {/* Optional Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={formData.email}
              onChange={e =>
                setFormData(prev => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          {/* Report Run Frequency */}
          <AppSelect
            selectLabel="Report Run Frequency"
            selectValue={formData.reportRunFrequency}
            selectPlaceholder="Select frequency"
            selectClassname="w-full space-y-2"
            selectOnChange={val =>
              setFormData(prev => ({ ...prev, reportRunFrequency: val }))
            }
            selectOptions={[
              { id: 'daily', name: 'Daily' },
              { id: 'weekly', name: 'Weekly' },
              { id: 'monthly', name: 'Monthly' },
            ]}
          />

          {/* Active toggle */}
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.isActive}
              onCheckedChange={val =>
                setFormData(prev => ({ ...prev, isActive: Boolean(val) }))
              }
            />
            <Label className="text-md">Active</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/adhoc-query')}
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

export default CreateAdhocQuery
