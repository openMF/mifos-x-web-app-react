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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import AppSelect from '@/components/custom/select/AppSelect'
import { Checkbox } from '@/components/ui/checkbox'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import {
  BulkLoansApi,
  OfficesApi,
  StaffApi,
  type GetOfficesResponse,
  type StaffData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const officesApi = new OfficesApi(getConfiguration())
const staffApi = new StaffApi(getConfiguration())
const bulkLoansApi = new BulkLoansApi(getConfiguration())

const BulkLoanReassignment = () => {
  const navigate = useNavigate()

  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [fromLoanOfficers, setFromLoanOfficers] = useState<StaffData[]>([])
  const [toLoanOfficers, setToLoanOfficers] = useState<StaffData[]>([])
  const [officerTemplate, setOfficerTemplate] =
    useState<Record<string, unknown>>()

  // form state
  const [formData, setFormData] = useState({
    officeId: '',
    assignmentDate: '',
    fromLoanOfficerId: '',
    toLoanOfficerId: '',
    selectedLoans: [] as number[],
  })

  // fetch offices
  useEffect(() => {
    ;(async () => {
      try {
        const res = await officesApi.retrieveOffices()
        setOffices(res.data || [])
      } catch (err) {
        console.error('Failed to fetch offices', err)
      }
    })()
  }, [])

  // fetch loan officers when office changes
  useEffect(() => {
    if (!formData.officeId) {
      setFromLoanOfficers([])
      setToLoanOfficers([])
      return
    }
    ;(async () => {
      try {
        const res = await staffApi.retrieveAll16(
          Number(formData.officeId),
          undefined,
          true
        )
        const staff = res.data ?? []
        setFromLoanOfficers(staff)
        setToLoanOfficers(staff)
      } catch (err) {
        console.error('Failed to fetch loan officers', err)
      }
    })()
  }, [formData.officeId])

  // fetch reassignment template when fromLoanOfficer changes
  useEffect(() => {
    if (!formData.officeId || !formData.fromLoanOfficerId) {
      setOfficerTemplate(undefined)
      return
    }
    ;(async () => {
      try {
        const res = await bulkLoansApi.loanReassignmentTemplate(
          Number(formData.officeId),
          Number(formData.fromLoanOfficerId)
        )
        const data =
          typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        setOfficerTemplate(data as Record<string, unknown>)
      } catch (err) {
        console.error('Failed to fetch reassignment template', err)
      }
    })()
  }, [formData.officeId, formData.fromLoanOfficerId])

  // handle form field updates
  const handleChange = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  // toggle loan selection (clients/groups)
  const handleLoanToggle = (loanId: number, checked: boolean) =>
    setFormData(prev => ({
      ...prev,
      selectedLoans: checked
        ? [...prev.selectedLoans, loanId]
        : prev.selectedLoans.filter(id => id !== loanId),
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = JSON.stringify({
        fromLoanOfficerId: Number(formData.fromLoanOfficerId),
        toLoanOfficerId: Number(formData.toLoanOfficerId),
        assignmentDate: formData.assignmentDate,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
        loans: formData.selectedLoans.reduce(
          (acc, id) => ({ ...acc, [id]: id }),
          {} as Record<number, number>
        ),
      })
      await bulkLoansApi.loanReassignment(payload)
      navigate('/organization')
    } catch (err) {
      console.error('Failed to reassign loans', err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Bulk Loan Reassignment', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Bulk Loan Reassignment</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Office selection */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Office*"
              selectPlaceholder="Select Office"
              selectValue={formData.officeId}
              selectOnChange={val => handleChange('officeId', val)}
              selectClassname="w-full space-y-2"
              selectOptions={offices.map(o => ({
                id: o.id?.toString() || '',
                name: o.name || '',
              }))}
            />
          </div>

          {/* Assignment Date */}
          <div className="w-full space-y-2">
            <Label>Assignment Date*</Label>
            <Input
              type="date"
              value={formData.assignmentDate}
              onChange={e => handleChange('assignmentDate', e.target.value)}
              required
            />
          </div>

          {/* From Loan Officer */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="From loan officer*"
              selectPlaceholder="Select loan officer"
              selectValue={formData.fromLoanOfficerId}
              selectOnChange={val => handleChange('fromLoanOfficerId', val)}
              selectClassname="w-full space-y-2"
              selectOptions={fromLoanOfficers.map(o => ({
                id: o.id?.toString() ?? '',
                name: o.displayName ?? '',
              }))}
            />
          </div>

          {/* To Loan Officer */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="To loan officer*"
              selectPlaceholder="Select loan officer"
              selectValue={formData.toLoanOfficerId}
              selectOnChange={val => handleChange('toLoanOfficerId', val)}
              selectClassname="w-full space-y-2"
              selectOptions={toLoanOfficers.map(o => ({
                id: o.id?.toString() ?? '',
                name: o.displayName ?? '',
              }))}
            />
          </div>

          {/* Loan selection (Clients & Groups) */}
          {officerTemplate && (
            <div className="flex flex-col gap-6">
              {/* Clients */}
              <div className="w-full space-y-2">
                <Label>Clients</Label>
                <div className="rounded-md border p-4 space-y-3">
                  {(
                    (
                      officerTemplate.accountSummaryCollection as Record<
                        string,
                        unknown
                      >
                    )?.clients as Record<string, unknown>[]
                  )?.map((client: Record<string, unknown>) => (
                    <div key={client.id as number}>
                      <div className="font-semibold">
                        {client.displayName as string}
                      </div>
                      <div className="mt-1 space-y-1 pl-2">
                        {(client.loans as Record<string, unknown>[]).map(
                          (loan: Record<string, unknown>) => (
                            <label
                              key={loan.id as string | number}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={formData.selectedLoans.includes(
                                  loan.id as number
                                )}
                                onCheckedChange={c =>
                                  handleLoanToggle(loan.id as number, !!c)
                                }
                              />
                              <span>
                                {loan.productName as string} (
                                {loan.accountNo as string})
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Groups */}
              <div className="w-full space-y-2">
                <Label>Groups</Label>
                <div className="rounded-md border p-4 space-y-3">
                  {(
                    (
                      officerTemplate.accountSummaryCollection as Record<
                        string,
                        unknown
                      >
                    )?.groups as Record<string, unknown>[]
                  )?.map((group: Record<string, unknown>) => (
                    <div key={group.id as number}>
                      <div className="font-semibold">
                        {group.displayName as string}
                      </div>
                      <div className="mt-1 space-y-1 pl-2">
                        {(group.loans as Record<string, unknown>[]).map(
                          (loan: Record<string, unknown>) => (
                            <label
                              key={loan.id as string | number}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox />
                              <span>
                                {loan.productName as string} (
                                {loan.accountNo as string})
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6">
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
              disabled={
                !formData.officeId ||
                !formData.assignmentDate ||
                !formData.toLoanOfficerId
              }
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BulkLoanReassignment
