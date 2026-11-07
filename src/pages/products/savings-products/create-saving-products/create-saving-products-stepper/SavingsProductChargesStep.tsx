/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'
import AppSelect from '@/components/custom/select/AppSelect'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  PostSavingsProductsRequest,
  GetSavingsProductsTemplateResponse,
  PostSavingsCharges,
} from '@/fineract-api'

interface SavingsProductChargesStepProps {
  formData: PostSavingsProductsRequest
  onChange: (data: PostSavingsProductsRequest) => void
  template: GetSavingsProductsTemplateResponse | undefined
}

const SavingsProductChargesStep = ({
  formData,
  onChange,
  template,
}: SavingsProductChargesStepProps) => {
  const [selectedChargeId, setSelectedChargeId] = useState('')

  const chargeOptions = Array.from(template?.chargeOptions ?? []).map(
    option => ({
      id: option.id!.toString(),
      name: option.name!,
      chargeTimeType: option.chargeTimeType?.code ?? '',
      amount: option.amount!,
      chargeCalculationType: option.chargeCalculationType?.code ?? '',
    })
  )

  const addedCharges = Array.from(formData.charges ?? [])

  const handleAdd = () => {
    const selected = chargeOptions.find(c => c.id === selectedChargeId)
    if (!selected) return
    const alreadyAdded = addedCharges.some(
      c => (c as PostSavingsCharges).id === +selected.id
    )
    if (alreadyAdded) return
    onChange({
      ...formData,
      charges: new Set([...addedCharges, { id: +selected.id }]),
    })
    setSelectedChargeId('')
  }

  const handleRemove = (id: string) => {
    onChange({
      ...formData,
      charges: new Set(
        addedCharges.filter((c: PostSavingsCharges) => c.id?.toString() !== id)
      ),
    })
  }

  const displayedCharges = addedCharges.map((c: PostSavingsCharges) => {
    const match = chargeOptions.find(o => o.id === c.id?.toString())
    return (
      match ?? {
        id: c.id?.toString(),
        name: '',
        chargeTimeType: '',
        amount: 0,
        chargeCalculationType: '',
      }
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <AppSelect
          selectLabel="Charge"
          selectPlaceholder="Select Charge"
          selectValue={selectedChargeId}
          selectOnChange={setSelectedChargeId}
          selectOptions={chargeOptions.map(c => ({ id: c.id, name: c.name }))}
          selectClassname="flex-1"
        />
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={!selectedChargeId}
        >
          + Add
        </Button>
      </div>

      {displayedCharges.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Collected On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedCharges.map(charge => (
              <TableRow key={charge.id}>
                <TableCell>{charge.name}</TableCell>
                <TableCell>{charge.chargeCalculationType}</TableCell>
                <TableCell>{charge.amount.toFixed(2)}</TableCell>
                <TableCell>{charge.chargeTimeType}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(charge.id ?? '')}
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default SavingsProductChargesStep
