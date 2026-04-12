/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SelectProps {
  selectLabel: string
  selectValue: string
  selectOnChange: (value: string) => void
  selectPlaceholder: string
  selectOptions: { id: number | string; name: string }[]
  selectClassname?: string
}

const AppSelect = ({
  selectLabel,
  selectValue,
  selectOnChange,
  selectPlaceholder,
  selectOptions,
  selectClassname = 'w-full md:w-[48%] space-y-2',
}: SelectProps) => {
  return (
    <div className={`${selectClassname}`}>
      <Label>{selectLabel}</Label>
      <Select value={selectValue} onValueChange={selectOnChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={selectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {selectOptions.map(opt => (
              <SelectItem key={opt.id} value={opt.id.toString()}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default AppSelect
