/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChargesApi,
  ClientApi,
  ClientChargesApi,
  type GetClientsClientIdResponse,
  type PostClientsClientIdChargesRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())
const clientChargesApi = new ClientChargesApi(getConfiguration())
const chargesApi = new ChargesApi(getConfiguration())

/** Today as yyyy-MM-dd in local time */
const todayInputValue = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface ClientChargeOption {
  id: number
  name: string
  amount?: number
  currency?: {
    code?: string
    name?: string
    displaySymbol?: string
  }
  chargeTimeType?: {
    id?: number
    code?: string
    value?: string
  }
  chargeCalculationType?: {
    id?: number
    code?: string
    value?: string
  }
  feeInterval?: number
}

interface ChargeDetailResponse {
  id?: number
  name?: string
  amount?: number
  currency?: {
    code?: string
    name?: string
  }
  chargeTimeType?: {
    id?: number
    code?: string
    value?: string
  }
  chargeCalculationType?: {
    id?: number
    code?: string
    value?: string
  }
  feeInterval?: number
}

interface ClientChargePayload extends PostClientsClientIdChargesRequest {
  feeOnMonthDay?: string
  feeInterval?: number
  monthDayFormat?: string
}

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/**
 * Add Client Charge component - matching Angular web app UI parity.
 */
const AddClientCharge = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [chargeOptions, setChargeOptions] = useState<ClientChargeOption[]>([])
  const [selectedChargeId, setSelectedChargeId] = useState<string>('')
  const [chargeDetails, setChargeDetails] =
    useState<ChargeDetailResponse | null>(null)

  const [amount, setAmount] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>(todayInputValue())
  const [feeOnMonthDay, setFeeOnMonthDay] = useState<string>('')
  const [feeInterval, setFeeInterval] = useState<string>('')

  const [error, setError] = useState<string | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const activeChargeRequestIdRef = useRef<string>('')

  // Fetch client details & charges template
  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      setLoadingTemplate(true)
      try {
        const [clientRes, templateRes] = await Promise.all([
          clientApi.retrieveOne11(Number(id)),
          clientChargesApi.retrieveTemplate4(Number(id)),
        ])
        setClient(clientRes.data)

        const rawTemplate = templateRes.data as unknown as {
          chargeOptions?: ClientChargeOption[]
        }
        setChargeOptions(rawTemplate?.chargeOptions ?? [])
      } catch (err) {
        console.error('Failed to load client charge template', err)
        setError(t('addCharge.errors.failedLoadTemplate'))
      } finally {
        setLoadingTemplate(false)
      }
    }

    loadData()
  }, [id, t])

  // When a charge is selected, fetch full charge details
  const handleChargeChange = async (value: string) => {
    setSelectedChargeId(value)
    setChargeDetails(null)
    setAmount('')
    setError(null)
    activeChargeRequestIdRef.current = value

    const selectedOption = chargeOptions.find(o => String(o.id) === value)
    if (!selectedOption) return

    try {
      const res = await chargesApi.retrieveCharge(Number(value), {
        params: { template: 'true' },
      })
      if (activeChargeRequestIdRef.current !== value) return

      const data = res.data as ChargeDetailResponse
      setChargeDetails(data)
      setAmount(
        data.amount !== undefined
          ? String(data.amount)
          : String(selectedOption.amount ?? '')
      )
      if (data.feeInterval !== undefined) {
        setFeeInterval(String(data.feeInterval))
      }
    } catch {
      if (activeChargeRequestIdRef.current !== value) return
      // Fallback to option from template
      setChargeDetails(selectedOption)
      setAmount(
        selectedOption.amount !== undefined ? String(selectedOption.amount) : ''
      )
      if (selectedOption.feeInterval !== undefined) {
        setFeeInterval(String(selectedOption.feeInterval))
      }
    }
  }

  const backToClient = () => navigate(`/clients/${id}/general`)

  // Charge time type logic matching Angular
  const chargeTimeTypeValue = chargeDetails?.chargeTimeType?.value
  const isDueDateNotRequired =
    chargeTimeTypeValue === 'Withdrawal Fee' ||
    chargeTimeTypeValue === 'Saving No Activity Fee'
  const isAnnualOrMonth =
    chargeTimeTypeValue === 'Annual Fee' ||
    chargeTimeTypeValue === 'Monthly Fee'
  const isMonthly = chargeTimeTypeValue === 'Monthly Fee'

  // Validation
  const validate = (): string | null => {
    if (!selectedChargeId) {
      return t('addCharge.errors.chargeRequired')
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return t('addCharge.errors.amountPositive')
    }
    if (!isDueDateNotRequired) {
      if (isAnnualOrMonth) {
        if (!feeOnMonthDay) {
          return t('addCharge.errors.feeOnMonthDayRequired')
        }
      } else {
        if (!dueDate) {
          return t('addCharge.errors.dueDateRequired')
        }
      }
    }
    if (isMonthly && !feeInterval) {
      return t('addCharge.errors.feeIntervalRequired')
    }
    return null
  }

  const isFormValid =
    Boolean(selectedChargeId) &&
    Boolean(amount) &&
    Number(amount) > 0 &&
    (isDueDateNotRequired ||
      (isAnnualOrMonth ? Boolean(feeOnMonthDay) : Boolean(dueDate))) &&
    (!isMonthly || Boolean(feeInterval))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload: ClientChargePayload = {
        chargeId: Number(selectedChargeId),
        amount: Number(amount),
        locale: 'en',
      }

      if (!isDueDateNotRequired) {
        if (isAnnualOrMonth) {
          payload.monthDayFormat = 'MMMM-dd'
          payload.feeOnMonthDay = feeOnMonthDay
        } else {
          payload.dateFormat = 'yyyy-MM-dd'
          payload.dueDate = dueDate
        }
      }

      if (isMonthly && feeInterval) {
        payload.feeInterval = Number(feeInterval)
      }

      await clientChargesApi.applyClientCharge(
        Number(id),
        payload as PostClientsClientIdChargesRequest
      )

      const state: RouteSuccessState = {
        successMessage: t('success.chargeAdded'),
      }
      navigate(`/clients/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<ApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('addCharge.errors.failedAddCharge')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-8 py-6">
      {/* Title & Breadcrumbs matching Angular App */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-[3px] h-6 bg-[#0e77b7]" />
          <h1 className="text-[22px] font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
            {client?.displayName}
          </h1>
        </div>

        <nav
          className="flex items-center space-x-1 text-xs text-[#0e77b7]"
          aria-label="Breadcrumb"
        >
          <Link to="/clients" className="hover:underline">
            {t('title')}
          </Link>
          <span className="text-zinc-400">›</span>
          <Link to={`/clients/${id}/general`} className="hover:underline">
            {client?.displayName}
          </Link>
          <span className="text-zinc-400">›</span>
          <span className="text-zinc-500 font-normal">
            {t('addCharge.title')}
          </span>
        </nav>
      </div>

      {/* Card Container - Centered with 37rem width */}
      <div className="w-full max-w-[37rem] mx-auto mt-6">
        <div className="bg-white dark:bg-zinc-900 rounded-[4px] border border-zinc-200 dark:border-zinc-800 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1),0_4px_5px_0_rgba(0,0,0,0.06),0_1px_10px_0_rgba(0,0,0,0.05)] p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Charge Select Field (Material filled style) */}
            <div className="relative rounded-t-[4px] bg-[#f5f5f5] dark:bg-zinc-800 border-b border-zinc-400 dark:border-zinc-600 focus-within:border-b-2 focus-within:border-[#0e77b7] transition-all">
              <Select
                value={selectedChargeId}
                onValueChange={handleChargeChange}
                disabled={loadingTemplate || chargeOptions.length === 0}
              >
                <SelectTrigger
                  id="chargeId"
                  className="w-full h-14 bg-transparent border-none shadow-none rounded-none px-3.5 pt-3 pb-1 text-[15px] focus:ring-0 focus:outline-none flex justify-between items-center"
                >
                  <div className="flex flex-col items-start text-left truncate">
                    <span
                      className={`text-[11px] leading-tight text-zinc-500 transition-all ${
                        selectedChargeId ? 'opacity-100' : 'opacity-0 h-0'
                      }`}
                    >
                      {t('addCharge.charge')}*
                    </span>
                    <SelectValue
                      placeholder={
                        <span className="text-[15px] text-zinc-600 dark:text-zinc-300 font-normal">
                          {loadingTemplate
                            ? tc('actions.loading')
                            : chargeOptions.length === 0
                              ? tc('ui.noOptions')
                              : `${t('addCharge.charge')}*`}
                        </span>
                      }
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {chargeOptions.map(opt => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {`${opt.name} (${opt.currency?.name || opt.currency?.code || ''})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic fields once charge is selected */}
            {chargeDetails && (
              <div className="space-y-4 pt-1">
                {/* Amount */}
                <div className="relative rounded-t-[4px] bg-[#f5f5f5] dark:bg-zinc-800 border-b border-zinc-400 dark:border-zinc-600 focus-within:border-b-2 focus-within:border-[#0e77b7] px-3.5 pt-2 pb-1.5 transition-all">
                  <label
                    htmlFor="amount"
                    className="block text-[11px] leading-tight text-zinc-500 font-normal"
                  >
                    {t('addCharge.amount')}*
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={e => {
                      setAmount(e.target.value)
                      setError(null)
                    }}
                    className="w-full bg-transparent border-none outline-none text-[15px] text-zinc-800 dark:text-zinc-100 p-0 focus:ring-0"
                  />
                </div>

                {/* Charge Calculation (Disabled / Read-only) */}
                <div className="relative rounded-t-[4px] bg-[#f5f5f5] dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 px-3.5 pt-2 pb-1.5 opacity-80 cursor-not-allowed">
                  <label
                    htmlFor="chargeCalculation"
                    className="block text-[11px] leading-tight text-zinc-500 font-normal"
                  >
                    {t('addCharge.chargeCalculation')}
                  </label>
                  <input
                    id="chargeCalculation"
                    disabled
                    value={chargeDetails.chargeCalculationType?.value ?? ''}
                    className="w-full bg-transparent border-none outline-none text-[15px] text-zinc-600 dark:text-zinc-300 p-0 cursor-not-allowed"
                  />
                </div>

                {/* Charge time type (Disabled / Read-only) */}
                <div className="relative rounded-t-[4px] bg-[#f5f5f5] dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 px-3.5 pt-2 pb-1.5 opacity-80 cursor-not-allowed">
                  <label
                    htmlFor="chargeTimeType"
                    className="block text-[11px] leading-tight text-zinc-500 font-normal"
                  >
                    {t('addCharge.chargeTimeType')}
                  </label>
                  <input
                    id="chargeTimeType"
                    disabled
                    value={chargeDetails.chargeTimeType?.value ?? ''}
                    className="w-full bg-transparent border-none outline-none text-[15px] text-zinc-600 dark:text-zinc-300 p-0 cursor-not-allowed"
                  />
                </div>

                {/* Due Date field */}
                {!isDueDateNotRequired && (
                  <>
                    {isAnnualOrMonth ? (
                      <div className="relative rounded-t-[4px] bg-[#f5f5f5] dark:bg-zinc-800 border-b border-zinc-400 dark:border-zinc-600 focus-within:border-b-2 focus-within:border-[#0e77b7] px-3.5 pt-2 pb-1.5 transition-all">
                        <label
                          htmlFor="feeOnMonthDay"
                          className="block text-[11px] leading-tight text-zinc-500 font-normal"
                        >
                          {t('addCharge.dueOn')}*
                        </label>
                        <input
                          id="feeOnMonthDay"
                          type="date"
                          required
                          value={feeOnMonthDay}
                          onChange={e => {
                            setFeeOnMonthDay(e.target.value)
                            setError(null)
                          }}
                          className="w-full bg-transparent border-none outline-none text-[15px] text-zinc-800 dark:text-zinc-100 p-0 focus:ring-0"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-t-[4px] bg-[#f5f5f5] dark:bg-zinc-800 border-b border-zinc-400 dark:border-zinc-600 focus-within:border-b-2 focus-within:border-[#0e77b7] px-3.5 pt-2 pb-1.5 transition-all">
                        <label
                          htmlFor="dueDate"
                          className="block text-[11px] leading-tight text-zinc-500 font-normal"
                        >
                          {t('addCharge.dueDate')}*
                        </label>
                        <input
                          id="dueDate"
                          type="date"
                          required
                          value={dueDate}
                          onChange={e => {
                            setDueDate(e.target.value)
                            setError(null)
                          }}
                          className="w-full bg-transparent border-none outline-none text-[15px] text-zinc-800 dark:text-zinc-100 p-0 focus:ring-0"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Monthly fee interval */}
                {isMonthly && (
                  <div className="relative rounded-t-[4px] bg-[#f5f5f5] dark:bg-zinc-800 border-b border-zinc-400 dark:border-zinc-600 focus-within:border-b-2 focus-within:border-[#0e77b7] px-3.5 pt-2 pb-1.5 transition-all">
                    <label
                      htmlFor="feeInterval"
                      className="block text-[11px] leading-tight text-zinc-500 font-normal"
                    >
                      {t('addCharge.repeatsEvery')}*
                    </label>
                    <input
                      id="feeInterval"
                      type="number"
                      required
                      value={feeInterval}
                      onChange={e => {
                        setFeeInterval(e.target.value)
                        setError(null)
                      }}
                      className="w-full bg-transparent border-none outline-none text-[15px] text-zinc-800 dark:text-zinc-100 p-0 focus:ring-0"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-[4px] border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Action Buttons matching Angular Material buttons */}
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                type="button"
                onClick={backToClient}
                className="min-w-[80px] px-4 py-1.5 rounded-[4px] bg-white hover:bg-zinc-50 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-sm font-medium shadow-sm transition-colors cursor-pointer"
              >
                {t('addCharge.cancel')}
              </button>
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className={`min-w-[80px] px-4 py-1.5 rounded-[4px] text-sm font-medium transition-colors ${
                  !isFormValid || submitting
                    ? 'bg-[#e0e0e0] dark:bg-zinc-800 text-[#9e9e9e] dark:text-zinc-500 cursor-not-allowed shadow-none'
                    : 'bg-[#0e77b7] hover:bg-[#0662a3] text-white shadow-sm cursor-pointer'
                }`}
              >
                {submitting ? tc('actions.loading') : t('addCharge.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddClientCharge
