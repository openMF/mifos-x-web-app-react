/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import { getConfiguration } from '@/lib/fineract-openapi'
import { AccountingClosureApi, type GetGlClosureResponse } from '@/fineract-api'

const closureApi = new AccountingClosureApi(getConfiguration())

const EditClosure = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [closure, setClosure] = useState<GetGlClosureResponse>()
  const [formData, setFormData] = useState({
    officeId: '',
    closingDate: '',
    comments: '',
  })

  const toInputDate = (d: unknown) => {
    if (Array.isArray(d) && d.length >= 3) {
      const [y, m, dd] = d
      return `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    }
    return typeof d === 'string' ? d.slice(0, 10) : ''
  }

  useEffect(() => {
    const closureId = Number(id)
    if (!id || isNaN(closureId)) return
    ;(async () => {
      try {
        const res = await closureApi.retreiveClosure(closureId)
        const c = res.data
        setClosure(c)
        setFormData({
          officeId: String(c.officeId ?? c.officeId ?? ''),
          closingDate: toInputDate(c.closingDate),
          comments: c.comments ?? '',
        })
      } catch (err) {
        console.error('Failed to fetch GL Closure', err)
      }
    })()
  }, [id])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await closureApi.updateGLClosure(Number(id), {
        comments: formData.comments,
      })
      alert('Closure updated successfully!')
      navigate('/accounting/closing-entries')
    } catch (err) {
      console.error('Failed to update closure', err)
      alert('Failed to update closure')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Closing Entries', href: '/accounting/closing-entries' },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Closing Entry</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Office* — prefilled & disabled */}
          <div className="w-full space-y-2">
            <div className="pointer-events-none opacity-60">
              <AppSelect
                selectLabel="Office*"
                selectPlaceholder="Select Office"
                selectValue={formData.officeId}
                selectOnChange={() => {}}
                selectOptions={
                  closure
                    ? [
                        {
                          id: String(
                            closure.officeId ?? closure.officeId ?? ''
                          ),
                          name: String(
                            closure.officeName ?? closure.officeName ?? ''
                          ),
                        },
                      ]
                    : []
                }
                selectClassname="w-full space-y-2"
              />
            </div>
          </div>

          {/* Closing Date */}
          <div className="w-full space-y-2">
            <Label>Closing Date*</Label>
            <Input type="date" value={formData.closingDate} disabled />
          </div>

          {/* Comments */}
          <div className="w-full space-y-2">
            <Label>Comments</Label>
            <Input
              value={formData.comments}
              onChange={e => handleChange('comments', e.target.value)}
            />
          </div>

          <div className="flex justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting/closing-entries')}
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

export default EditClosure
