/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClientApi,
  ClientChargesApi,
  type GetClientsClientIdResponse,
  type PostClientsClientIdChargesRequest,
} from '@/fineract-api'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())
const clientChargesApi = new ClientChargesApi(getConfiguration())

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
}

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/**
 * Add Client Charge component - matching client action patterns.
 */
const AddClientCharge = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [chargeOptions, setChargeOptions] = useState<ClientChargeOption[]>([])
  const [selectedChargeId, setSelectedChargeId] = useState<string>('')
  const [selectedCharge, setSelectedCharge] =
    useState<ClientChargeOption | null>(null)

  const [amount, setAmount] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>(todayInputValue())

  const [error, setError] = useState<string | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Fetch client details & charges template
  useEffect(() => {
    if (!id) return

    let isCurrent = true

    // Reset previous client & form state when id changes
    setClient(undefined)
    setChargeOptions([])
    setSelectedChargeId('')
    setSelectedCharge(null)
    setAmount('')
    setDueDate(todayInputValue())
    setError(null)
    setLoadingTemplate(true)

    const loadData = async () => {
      try {
        const [clientRes, templateRes] = await Promise.all([
          clientApi.retrieveOne11(Number(id)),
          clientChargesApi.retrieveTemplate4(Number(id)),
        ])

        if (!isCurrent) return

        setClient(clientRes.data)

        const rawTemplate = templateRes.data as unknown as {
          chargeOptions?: ClientChargeOption[]
        }
        setChargeOptions(rawTemplate?.chargeOptions ?? [])
      } catch (err) {
        if (!isCurrent) return
        console.error('Failed to load client charge template', err)
        setError(t('addCharge.errors.failedLoadTemplate'))
      } finally {
        if (isCurrent) {
          setLoadingTemplate(false)
        }
      }
    }

    loadData()

    return () => {
      isCurrent = false
    }
  }, [id, t])

  // Guard: only active clients (status 300) can have charges added. Redirect if opened directly.
  useEffect(() => {
    if (client && client.status?.id !== 300) {
      navigate(`/clients/${id}/general`, { replace: true })
    }
  }, [client, id, navigate])

  const activatedOnDate = dateArrayToInputValue(
    client?.timeline?.activatedOnDate as number[] | undefined
  )
  const submittedOnDate = dateArrayToInputValue(
    client?.timeline?.submittedOnDate as number[] | undefined
  )
  const minDate = activatedOnDate || submittedOnDate

  // When a charge is selected, pull details directly from template options
  const handleChargeChange = (value: string) => {
    setSelectedChargeId(value)
    setError(null)

    const option = chargeOptions.find(o => String(o.id) === value)
    setSelectedCharge(option ?? null)
    setAmount(option?.amount !== undefined ? String(option.amount) : '')
  }

  const backToClient = () => navigate(`/clients/${id}/general`)

  // Validation
  const validate = (): string | null => {
    if (!selectedChargeId) {
      return t('addCharge.errors.chargeRequired')
    }
    const numericAmount = Number(amount)
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return t('addCharge.errors.amountPositive')
    }
    if (!dueDate) {
      return t('addCharge.errors.dueDateRequired')
    }
    if (minDate && dueDate < minDate) {
      return t('addCharge.errors.dueDateBeforeActivation')
    }
    return null
  }

  const isFormValid =
    !loadingTemplate &&
    Boolean(client) &&
    String(client?.id) === id &&
    Boolean(selectedChargeId) &&
    Boolean(amount) &&
    !isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    Boolean(dueDate) &&
    (!minDate || dueDate >= minDate)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || String(client.id) !== id || client.status?.id !== 300) {
      return
    }

    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Note: PostClientsClientIdChargesRequest declares amount as int32 integer in fineract.yaml,
      // but Fineract processes charge amounts as BigDecimal. Tracked in ISSUES.md.
      const payload: PostClientsClientIdChargesRequest = {
        chargeId: Number(selectedChargeId),
        amount: Number(amount),
        dueDate,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }

      await clientChargesApi.applyClientCharge(Number(id), payload)

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
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          {
            label: client?.displayName ?? '',
            href: `/clients/${id}/general`,
          },
          { label: t('addCharge.title'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">
            {t('addCharge.title')}
          </h2>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Charge Select Field */}
            <div className="space-y-2">
              <Label htmlFor="chargeId" className="text-sm font-medium">
                {t('addCharge.charge')}*
              </Label>
              <Select
                value={selectedChargeId}
                onValueChange={handleChargeChange}
                disabled={loadingTemplate || chargeOptions.length === 0}
              >
                <SelectTrigger id="chargeId" className="w-full">
                  <SelectValue
                    placeholder={
                      loadingTemplate
                        ? tc('actions.loading')
                        : chargeOptions.length === 0
                          ? tc('ui.noOptions')
                          : `${t('addCharge.charge')}*`
                    }
                  />
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
            {selectedCharge && (
              <>
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    {t('addCharge.amount')}*
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={amount}
                    onChange={e => {
                      setAmount(e.target.value)
                      setError(null)
                    }}
                  />
                </div>

                {/* Charge Calculation (Disabled / Read-only) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="chargeCalculation"
                    className="text-sm font-medium"
                  >
                    {t('addCharge.chargeCalculation')}
                  </Label>
                  <Input
                    id="chargeCalculation"
                    disabled
                    value={selectedCharge.chargeCalculationType?.value ?? ''}
                    className="cursor-not-allowed bg-zinc-100 dark:bg-zinc-800"
                  />
                </div>

                {/* Charge time type (Disabled / Read-only) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="chargeTimeType"
                    className="text-sm font-medium"
                  >
                    {t('addCharge.chargeTimeType')}
                  </Label>
                  <Input
                    id="chargeTimeType"
                    disabled
                    value={selectedCharge.chargeTimeType?.value ?? ''}
                    className="cursor-not-allowed bg-zinc-100 dark:bg-zinc-800"
                  />
                </div>

                {/* Due Date field */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    {t('addCharge.dueDate')}*
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    required
                    min={minDate || undefined}
                    value={dueDate}
                    onChange={e => {
                      setDueDate(e.target.value)
                      setError(null)
                    }}
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Action Buttons matching standard client actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={backToClient}
                disabled={submitting}
              >
                {t('addCharge.cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                disabled={!isFormValid || submitting}
              >
                {submitting ? tc('actions.loading') : t('addCharge.submit')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddClientCharge
