/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'
import AppSelect from '@/components/custom/select/AppSelect'
import type {
  GetLoanProductsTemplateResponse,
  PostLoanProductsRequest,
  GetLoanProductsChargeOptions,
} from '@/fineract-api'

interface LoanProductChargesStepProps {
  formData: PostLoanProductsRequest
  onChange: (data: PostLoanProductsRequest) => void
  template: GetLoanProductsTemplateResponse
}

const COLUMNS = ['Name', 'Type', 'Amount', 'Collected On', 'Actions']

function ChargesTable({
  charges,
  onDelete,
}: {
  charges: GetLoanProductsChargeOptions[]
  onDelete: (i: number) => void
}) {
  if (charges.length === 0) return null
  return (
    <div className="rounded border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {COLUMNS.map(col => (
              <th key={col} className="text-left px-4 py-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {charges.map((charge, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2">{charge.name ?? '—'}</td>
              <td className="px-4 py-2">
                {charge.chargeCalculationType?.code ?? '—'}
              </td>
              <td className="px-4 py-2">{charge.amount ?? '—'}</td>
              <td className="px-4 py-2">
                {charge.chargeTimeType?.code ?? '—'}
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => onDelete(i)}
                  className="text-destructive hover:opacity-70 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const LoanProductChargesStep = ({
  formData,
  onChange,
  template,
}: LoanProductChargesStepProps) => {
  const [selectedChargeId, setSelectedChargeId] = useState('')
  const [charges, setCharges] = useState<GetLoanProductsChargeOptions[]>([])

  const [selectedOverdueChargeId, setSelectedOverdueChargeId] = useState('')
  const [overdueCharges, setOverdueCharges] = useState<
    GetLoanProductsChargeOptions[]
  >([])

  const chargeOptions = Array.from(template.chargeOptions ?? [])

  const regularCharges = chargeOptions.filter(c => !c.penalty)
  const overdueChargeOptions = chargeOptions.filter(c => c.penalty)

  const handleAddCharge = () => {
    if (!selectedChargeId) return
    const charge = regularCharges.find(
      c => c.id?.toString() === selectedChargeId
    )
    if (!charge) return
    const updated = [...charges, charge]
    setCharges(updated)
    setSelectedChargeId('')
    onChange({
      ...formData,
      charges: [...updated, ...overdueCharges].map(c => ({ id: c.id })),
    })
  }

  const handleAddOverdueCharge = () => {
    if (!selectedOverdueChargeId) return
    const charge = overdueChargeOptions.find(
      c => c.id?.toString() === selectedOverdueChargeId
    )
    if (!charge) return
    const updated = [...overdueCharges, charge]
    setOverdueCharges(updated)
    setSelectedOverdueChargeId('')
    onChange({
      ...formData,
      charges: [...(formData.charges ?? []), { id: charge.id }],
    })
  }

  const handleDeleteCharge = (i: number) => {
    const updated = charges.filter((_, idx) => idx !== i)
    setCharges(updated)
    onChange({
      ...formData,
      charges: [...updated, ...overdueCharges].map(c => ({ id: c.id })),
    })
  }

  const handleDeleteOverdueCharge = (i: number) => {
    const updated = overdueCharges.filter((_, idx) => idx !== i)
    setOverdueCharges(prev => prev.filter((_, idx) => idx !== i))

    const allCharges = [...charges, ...updated].map(c => ({ id: c.id }))
    onChange({ ...formData, charges: allCharges })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <AppSelect
            selectLabel="Charge"
            selectPlaceholder="Select Charge"
            selectValue={selectedChargeId}
            selectOnChange={setSelectedChargeId}
            selectOptions={regularCharges
              .filter(
                (
                  c
                ): c is GetLoanProductsChargeOptions & {
                  id: number
                  name: string
                } => c.id != null && c.name != null
              )
              .map(c => ({
                id: c.id,
                name: c.name,
              }))}
            selectClassname="flex-1 space-y-2"
          />
          <Button
            type="button"
            onClick={handleAddCharge}
            disabled={!selectedChargeId}
            className="text-white min-w-[100px]"
            style={{ backgroundColor: '#2081C3', borderColor: '#2081C3' }}
          >
            + Add
          </Button>
        </div>
        <ChargesTable charges={charges} onDelete={handleDeleteCharge} />
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Overdue Charges</Label>
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <AppSelect
            selectLabel="Overdue Charge"
            selectPlaceholder="Select Overdue Charge"
            selectValue={selectedOverdueChargeId}
            selectOnChange={setSelectedOverdueChargeId}
            selectOptions={overdueChargeOptions.map(c => ({
              id: c.id!,
              name: c.name!,
            }))}
            selectClassname="flex-1 space-y-2"
          />
          <Button
            type="button"
            onClick={handleAddOverdueCharge}
            disabled={!selectedOverdueChargeId}
            className="text-white min-w-[100px]"
            style={{ backgroundColor: '#2081C3', borderColor: '#2081C3' }}
          >
            + Add
          </Button>
        </div>
        <ChargesTable
          charges={overdueCharges}
          onDelete={handleDeleteOverdueCharge}
        />
      </div>
    </div>
  )
}

export default LoanProductChargesStep
