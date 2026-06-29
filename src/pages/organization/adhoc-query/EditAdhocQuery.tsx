/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

import { AdhocQueryApiApi, type EnumOptionData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const adhocApi = new AdhocQueryApiApi(getConfiguration())

const EditAdhocQuery = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [frequencies, setFrequencies] = useState<EnumOptionData[]>([])
  const [reportRunEvery, setReportRunEvery] = useState<number | undefined>(
    undefined
  )

  //edit form payload
  const [formData, setFormData] = useState({
    name: '',
    query: '',
    tableName: '',
    tableFields: '',
    email: '',
    reportRunFrequency: '',
    isActive: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const res = await adhocApi.retrieveAdHocQuery(Number(id), {
          params: { template: true },
        })
        const a = res.data ?? {}
        setFrequencies(a.reportRunFrequencies || [])
        setReportRunEvery(a.reportRunEvery)
        setFormData({
          name: a.name ?? '',
          query: a.query ?? '',
          tableName: a.tableName ?? '',
          tableFields: a.tableFields ?? '',
          email: a.email ?? '',
          reportRunFrequency:
            a.reportRunFrequency != null ? String(a.reportRunFrequency) : '',
          isActive: a.isActive ?? false,
        })
      } catch (err) {
        console.error('Failed to load ad-hoc query', err)
      }
    }
    fetchData()
  }, [id])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.name ||
      !formData.query ||
      !formData.tableName ||
      !formData.tableFields
    ) {
      alert('Please fill all required fields.')
      return
    }
    try {
      await adhocApi.update(Number(id), {
        name: formData.name,
        query: formData.query,
        tableName: formData.tableName,
        tableFields: formData.tableFields,
        email: formData.email,
        reportRunFrequency: formData.reportRunFrequency
          ? Number(formData.reportRunFrequency)
          : undefined,
        reportRunEvery,
        isActive: formData.isActive,
      })
      alert('Adhoc Query updated successfully!')
      navigate('/organization/adhoc-query')
    } catch (err) {
      console.error('Failed to update adhoc query', err)
      alert('Failed to update adhoc query')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Adhoc Query', href: '/organization/adhoc-query' },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Adhoc Query</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            {/* Adhoc Name */}
            <Label>Name*</Label>
            <Input
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            {/* SQL query input */}
            <Label>SQL Query*</Label>
            <Input
              value={formData.query}
              onChange={e => handleChange('query', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Insert into table*</Label>
            <Input
              value={formData.tableName}
              onChange={e => handleChange('tableName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Table Fields*</Label>
            <Input
              value={formData.tableFields}
              onChange={e => handleChange('tableFields', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            {/* Email Input */}
            <Label>Email</Label>
            <Input
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          </div>

          <AppSelect
            selectLabel="Report Run Frequency"
            selectPlaceholder="Select frequency"
            selectValue={formData.reportRunFrequency}
            selectClassname="w-full space-y-2"
            selectOnChange={val => handleChange('reportRunFrequency', val)}
            selectOptions={frequencies.map(f => ({
              id: f.id?.toString() || '',
              name: f.value || '',
            }))}
          />

          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.isActive}
              onCheckedChange={checked =>
                setFormData(prev => ({ ...prev, isActive: checked === true }))
              }
            />
            <Label className="text-md">Active</Label>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            {/* Buttons */}
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

export default EditAdhocQuery
