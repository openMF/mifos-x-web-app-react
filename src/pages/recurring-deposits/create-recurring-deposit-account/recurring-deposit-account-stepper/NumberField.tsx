/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toOptionalNumber } from '../recurring-deposit-account-form'

interface NumberFieldProps {
  id: string
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  min?: number
  step?: number
  className?: string
}

/** A labelled number input that keeps an empty value unset */
const NumberField = ({
  id,
  label,
  value,
  onChange,
  min = 0,
  step,
  className = 'flex-1 space-y-2',
}: NumberFieldProps) => (
  <div className={className}>
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      min={min}
      step={step}
      value={value ?? ''}
      onChange={e => onChange(toOptionalNumber(e.target.value))}
    />
  </div>
)

export default NumberField
