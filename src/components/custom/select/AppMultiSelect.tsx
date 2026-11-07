/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MultiSelectProps {
  selectLabel: string
  selectValues: string[]
  selectOnChange: (values: string[]) => void
  selectPlaceholder: string
  selectOptions: { id: number | string; name: string }[]
  selectClassname?: string
}

/** A multiple-choice counterpart to AppSelect, with the same props shape. */
const AppMultiSelect = ({
  selectLabel,
  selectValues,
  selectOnChange,
  selectPlaceholder,
  selectOptions,
  selectClassname = 'w-full md:w-[48%] space-y-2',
}: MultiSelectProps) => {
  const toggle = (id: string, checked: boolean) => {
    selectOnChange(
      checked
        ? [...selectValues, id]
        : selectValues.filter(value => value !== id)
    )
  }

  const selectedNames = selectOptions
    .filter(opt => selectValues.includes(opt.id.toString()))
    .map(opt => opt.name)

  return (
    <div className={selectClassname}>
      <Label>{selectLabel}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selectedNames.length > 0
                ? selectedNames.join(', ')
                : selectPlaceholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2">
          <div className="max-h-64 overflow-y-auto space-y-1">
            {selectOptions.map(opt => {
              const id = opt.id.toString()
              const inputId = `multi-select-${id}`
              return (
                <label
                  key={id}
                  htmlFor={inputId}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    id={inputId}
                    checked={selectValues.includes(id)}
                    onCheckedChange={checked => toggle(id, checked === true)}
                  />
                  {opt.name}
                </label>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default AppMultiSelect
