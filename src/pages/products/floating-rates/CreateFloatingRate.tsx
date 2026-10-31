/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'
import { Plus, Trash2 } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FloatingRatesApi } from '@/fineract-api'
import { businessDateInputValue } from '@/lib/business-date'
import { todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const floatingRateApi = new FloatingRatesApi(getConfiguration())

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** One editable rate period; inputs are kept as strings until submit */
type PeriodRow = {
  key: number
  fromDate: string
  interestRate: string
  isDifferential: boolean
}

/** The day after a yyyy-MM-dd date, in the same format */
const nextDay = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Every message Fineract sent back, or the fallback when there is none */
const apiErrorMessages = (err: unknown, fallback: string) => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  const messages = (data?.errors ?? [])
    .map(e => e.defaultUserMessage)
    .filter((m): m is string => !!m)
  if (messages.length) return messages
  return [data?.defaultUserMessage || fallback]
}

/**
 * Creates a floating rate (POST /floatingrates), the Create page of the
 * Angular web app: a name, the Base Lending Rate and Active flags, and the
 * rate periods, each with the date it takes effect, its interest rate and
 * whether that rate is added to the base lending rate.
 */
const CreateFloatingRate = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['products', 'common'])

  const [name, setName] = useState('')
  const [isBaseLendingRate, setIsBaseLendingRate] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [periods, setPeriods] = useState<PeriodRow[]>([])
  const [nextKey, setNextKey] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Fineract only accepts from dates after the business date, so the earliest
  // allowed date starts as tomorrow and is replaced once the business date loads
  const [minDate, setMinDate] = useState(() => nextDay(todayInputValue()))

  useEffect(() => {
    let active = true
    businessDateInputValue().then(date => {
      if (active) setMinDate(nextDay(date))
    })
    return () => {
      active = false
    }
  }, [])

  const addPeriod = () => {
    setPeriods(prev => [
      ...prev,
      { key: nextKey, fromDate: '', interestRate: '', isDifferential: false },
    ])
    setNextKey(k => k + 1)
    setErrors([])
  }

  const removePeriod = (key: number) => {
    setPeriods(prev => prev.filter(p => p.key !== key))
    setErrors([])
  }

  const updatePeriod = (key: number, changes: Partial<PeriodRow>) => {
    setPeriods(prev =>
      prev.map(p => (p.key === key ? { ...p, ...changes } : p))
    )
    setErrors([])
  }

  const handleBaseLendingRateChange = (checked: boolean) => {
    setIsBaseLendingRate(checked)
    // A base lending rate cannot have periods that are differential to itself
    if (checked)
      setPeriods(prev => prev.map(p => ({ ...p, isDifferential: false })))
    setErrors([])
  }

  /** Returns the first problem with the form, or null when it can be sent */
  const formProblem = (): string | null => {
    if (!name.trim()) return t('floatingRate.validation.nameRequired')
    if (periods.length === 0) return t('floatingRate.validation.periodRequired')
    for (const [i, p] of periods.entries()) {
      const row = i + 1
      if (!p.fromDate || p.interestRate.trim() === '')
        return t('floatingRate.validation.fillEveryField', { row })
      if (p.fromDate < minDate)
        return t('floatingRate.validation.fromDateInFuture', { row })
      const rate = Number(p.interestRate)
      if (!Number.isFinite(rate))
        return t('floatingRate.validation.rateNotNumber', { row })
      if (rate < 0) return t('floatingRate.validation.rateNegative', { row })
    }
    const dates = periods.map(p => p.fromDate)
    if (new Set(dates).size !== dates.length)
      return t('floatingRate.validation.duplicateFromDate')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const problem = formProblem()
    if (problem) return setErrors([problem])

    setSubmitting(true)
    setErrors([])
    try {
      const res = await floatingRateApi.createFloatingRate({
        name: name.trim(),
        isBaseLendingRate,
        isActive,
        ratePeriods: periods.map(p => ({
          fromDate: p.fromDate,
          interestRate: Number(p.interestRate),
          isDifferentialToBaseLendingRate: p.isDifferential,
          locale: 'en',
          dateFormat: 'yyyy-MM-dd',
        })),
      })
      const id = res.data?.resourceId
      const state: RouteSuccessState = {
        successMessage: t('floatingRate.created'),
      }
      navigate(
        id ? `/products/floating-rates/${id}` : '/products/floating-rates',
        { state }
      )
    } catch (err) {
      setErrors(apiErrorMessages(err, t('floatingRate.errors.createFailed')))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/products' },
          { label: t('floatingRates'), href: '/products/floating-rates' },
          { label: t('common:actions.create'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow">
        <h2 className="text-2xl font-semibold mb-6">
          {t('floatingRate.createTitle')}
        </h2>

        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label htmlFor="floatingRateName">
                {t('floatingRate.fields.nameRequired')}
              </Label>
              <Input
                id="floatingRateName"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setErrors([])
                }}
              />
            </div>
            <div className="flex items-center gap-2 md:h-9">
              <Checkbox
                id="isBaseLendingRate"
                checked={isBaseLendingRate}
                onCheckedChange={v => handleBaseLendingRateChange(!!v)}
              />
              <Label htmlFor="isBaseLendingRate">
                {t('floatingRate.fields.isBaseLendingRate')}
              </Label>
            </div>
            <div className="flex items-center gap-2 md:h-9">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={v => {
                  setIsActive(!!v)
                  setErrors([])
                }}
              />
              <Label htmlFor="isActive">
                {t('floatingRate.fields.active')}
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('floatingRate.periods.title')}
              </h3>
              <Button type="button" variant="outline" onClick={addPeriod}>
                <Plus className="mr-1 h-4 w-4" />
                {t('floatingRate.periods.add')}
              </Button>
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3">
                      {t('floatingRate.periods.fromDateRequired')}
                    </TableHead>
                    <TableHead className="px-4 py-3">
                      {t('floatingRate.periods.interestRateRequired')}
                    </TableHead>
                    <TableHead className="px-4 py-3">
                      {t('floatingRate.periods.isDifferential')}
                    </TableHead>
                    <TableHead className="px-4 py-3 w-16">
                      <span className="sr-only">
                        {t('common:actions.delete')}
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        {t('floatingRate.periods.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                  {periods.map((p, i) => (
                    <TableRow key={p.key}>
                      <TableCell className="px-4 py-3">
                        <Input
                          type="date"
                          min={minDate}
                          className="w-44"
                          aria-label={t('floatingRate.periods.fieldForRow', {
                            field: t('floatingRate.periods.fromDate'),
                            row: i + 1,
                          })}
                          value={p.fromDate}
                          onChange={e =>
                            updatePeriod(p.key, { fromDate: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="w-32"
                          aria-label={t('floatingRate.periods.fieldForRow', {
                            field: t('floatingRate.periods.interestRate'),
                            row: i + 1,
                          })}
                          value={p.interestRate}
                          onChange={e =>
                            updatePeriod(p.key, {
                              interestRate: e.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Checkbox
                          checked={p.isDifferential}
                          disabled={isBaseLendingRate}
                          aria-label={t('floatingRate.periods.fieldForRow', {
                            field: t('floatingRate.periods.isDifferential'),
                            row: i + 1,
                          })}
                          onCheckedChange={v =>
                            updatePeriod(p.key, { isDifferential: !!v })
                          }
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t('floatingRate.periods.remove', {
                            row: i + 1,
                          })}
                          onClick={() => removePeriod(p.key)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {isBaseLendingRate && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('floatingRate.periods.baseRateNote')}
              </p>
            )}
          </div>

          {errors.length > 0 && (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {errors.length === 1 ? (
                errors[0]
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products/floating-rates')}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={submitting}
            >
              {submitting
                ? t('common:actions.saving')
                : t('common:actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFloatingRate
