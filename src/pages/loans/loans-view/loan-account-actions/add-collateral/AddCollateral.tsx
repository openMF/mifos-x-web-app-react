/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  LoanCollateralApi,
  type LoansLoanIdCollateralsRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import fineract from '@/lib/axios'

const loanCollateralApi = () =>
  new LoanCollateralApi(getConfiguration(), undefined, fineract)

const DEFAULT_COLLATERAL_OPTIONS = [{ id: '1', name: 'Test Collateral' }]

const AddCollateral = () => {
  const { loanId } = useParams()
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Add Collateral' })
  const navigate = useNavigate()

  // form state
  const [collateralOptions, setCollateralOptions] = useState<
    { id: number | string; name: string }[]
  >(DEFAULT_COLLATERAL_OPTIONS)
  const [collateralTypeId, setCollateralTypeId] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // fetch template or fallback
  useEffect(() => {
    if (!loanId) return
    let active = true

    const fetchTemplate = async () => {
      try {
        const res = await loanCollateralApi().newCollateralTemplate(
          Number(loanId)
        )
        const types = res?.data?.allowedCollateralTypes
        if (active && types && types.length > 0) {
          const apiOptions = types
            .filter(t => t.id != null && t.name)
            .map(t => ({ id: String(t.id), name: t.name as string }))
          if (apiOptions.length > 0) {
            setCollateralOptions(apiOptions)
            return
          }
        }
      } catch (err) {
        console.warn(
          'Failed to load collateral template, using default options',
          err
        )
      }
    }

    fetchTemplate()
    return () => {
      active = false
    }
  }, [loanId])

  // validation
  const canSubmit = Boolean(collateralTypeId && value)

  // handle submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      if (loanId) {
        await loanCollateralApi().createCollateral(Number(loanId), {
          collateralTypeId: Number(collateralTypeId),
          value: Number(value),
          description: description.trim() || undefined,
        } as LoansLoanIdCollateralsRequest)
      }
      navigate(-1)
    } catch (err: unknown) {
      console.error('createCollateral failed', err)
      const axiosErr = err as {
        response?: {
          data?: {
            defaultUserMessage?: string
            errors?: Array<{ defaultUserMessage?: string }>
          }
        }
      }
      const message =
        axiosErr?.response?.data?.defaultUserMessage ||
        axiosErr?.response?.data?.errors?.[0]?.defaultUserMessage ||
        'Failed to add collateral. Please try again.'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs items={breadcrumbs} />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Add Collateral</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* collateral type */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Collateral Type*"
              selectPlaceholder="Select collateral type"
              selectValue={collateralTypeId}
              selectOnChange={val => {
                setCollateralTypeId(val)
                if (submitError) setSubmitError(null)
              }}
              selectOptions={collateralOptions}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* value */}
          <div className="w-full space-y-2">
            <Label>Value*</Label>
            <Input
              type="number"
              value={value}
              onChange={e => {
                setValue(e.target.value)
                if (submitError) setSubmitError(null)
              }}
              min="0"
              step="0.01"
              placeholder="Enter value"
            />
          </div>

          {/* description */}
          <div className="w-full space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                if (submitError) setSubmitError(null)
              }}
              placeholder="Enter description"
            />
          </div>

          {submitError && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {submitError}
            </div>
          )}

          {/* actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || submitting}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCollateral
