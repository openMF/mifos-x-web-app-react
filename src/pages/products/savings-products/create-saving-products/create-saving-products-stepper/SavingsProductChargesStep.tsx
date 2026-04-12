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

type ChargeOption = {
  id: string
  name: string
  amount: number
  chargeTimeType: string
  chargeCalculationType: string
}

interface SavingsProductChargesFormData {
  charges: ChargeOption[]
  [key: string]: unknown
}

const SavingsProductChargesStep = ({
  formData,
  setFormData,
  chargeOptions,
}: {
  formData: SavingsProductChargesFormData
  setFormData: (
    updater: (
      prev: SavingsProductChargesFormData
    ) => SavingsProductChargesFormData
  ) => void
  chargeOptions: ChargeOption[]
}) => {
  const [selectedChargeId, setSelectedChargeId] = useState('')

  const handleAdd = () => {
    const selectedCharge = chargeOptions.find(c => c.id === selectedChargeId)
    if (selectedCharge) {
      setFormData(prev => ({
        ...prev,
        charges: [...(prev.charges || []), selectedCharge],
      }))
      setSelectedChargeId('')
    }
  }

  const handleRemove = (id: string) => {
    setFormData(prev => ({
      ...prev,
      charges: prev.charges.filter((c: ChargeOption) => c.id !== id),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Dropdown + Add */}
      <div className="flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1">
          <AppSelect
            selectLabel="Charge"
            selectPlaceholder="Select Charge"
            selectValue={selectedChargeId}
            selectOnChange={setSelectedChargeId}
            selectOptions={chargeOptions.map(c => ({
              id: c.id,
              name: c.name,
            }))}
          />
        </div>

        <div>
          <Button variant="outline" onClick={handleAdd}>
            + Add
          </Button>
        </div>
      </div>

      {/* Table of added charges */}
      {(formData.charges || []).length > 0 && (
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
            {formData.charges.map((charge: ChargeOption) => (
              <TableRow key={charge.id}>
                <TableCell>{charge.name}</TableCell>
                <TableCell>{charge.chargeCalculationType}</TableCell>
                <TableCell>{charge.amount.toFixed(2)}</TableCell>
                <TableCell>{charge.chargeTimeType}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(charge.id)}
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
