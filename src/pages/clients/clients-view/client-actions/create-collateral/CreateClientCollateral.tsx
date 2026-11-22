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
import { Loader2 } from 'lucide-react'

import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClientApi,
  ClientCollateralManagementApi,
  CollateralManagementApi,
  type GetClientsClientIdResponse,
  type LoanCollateralTemplateData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())
const collateralApi = new ClientCollateralManagementApi(getConfiguration())
const collateralManagementApi = new CollateralManagementApi(getConfiguration())

type ClientApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined || Number.isNaN(val)) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

/**
 * Creates client collateral (POST /clients/{id}/collaterals), matching
 * the "Create Collateral" action of the Angular web app.
 */
const CreateClientCollateral = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')

  const clientId = Number(id)
  const isValidId = !Number.isNaN(clientId) && clientId > 0

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [template, setTemplate] = useState<LoanCollateralTemplateData[]>([])
  const [loadingTemplate, setLoadingTemplate] = useState(true)
  const [selectedCollateralId, setSelectedCollateralId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('1')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchClient = async () => {
      if (!isValidId) {
        setError(
          t(
            'createCollateral.errors.failedFetchClient',
            'Failed to fetch client details.'
          )
        )
        return
      }
      try {
        const res = await clientApi.retrieveOne11(clientId)
        setClient(res.data)
      } catch (err) {
        console.error('Failed to fetch client', err)
        setError(
          t(
            'createCollateral.errors.failedFetchClient',
            'Failed to fetch client details.'
          )
        )
      }
    }

    const fetchTemplate = async () => {
      if (!isValidId) return
      try {
        setLoadingTemplate(true)
        let items: LoanCollateralTemplateData[] = []

        try {
          const res = await collateralApi.getClientCollateralTemplate(clientId)
          const data = res.data as unknown
          const rawItems = Array.isArray(data)
            ? (data as Array<Record<string, unknown>>)
            : typeof data === 'object' && data !== null
              ? ((data as Record<string, unknown>).collateralData ??
                (data as Record<string, unknown>).allowedCollateralTypes ??
                (data as Record<string, unknown>).data ??
                [])
              : []

          if (Array.isArray(rawItems) && rawItems.length > 0) {
            items = (rawItems as Array<Record<string, unknown>>).map(c => ({
              collateralId: (c.collateralId ?? c.id) as number | undefined,
              name: (c.name ?? c.collateralName) as string | undefined,
              basePrice: c.basePrice != null ? Number(c.basePrice) : undefined,
              pctToBase: c.pctToBase != null ? Number(c.pctToBase) : undefined,
            }))
          }
        } catch (templateErr) {
          console.warn(
            'getClientCollateralTemplate failed or empty',
            templateErr
          )
        }

        // Fallback to getAllCollaterals if template endpoint returned no products
        if (items.length === 0) {
          try {
            const allRes = await collateralManagementApi.getAllCollaterals()
            const allData = allRes.data
            if (Array.isArray(allData) && allData.length > 0) {
              items = allData.map(c => ({
                collateralId: c.id,
                name: c.name,
                basePrice:
                  c.basePrice != null ? Number(c.basePrice) : undefined,
                pctToBase:
                  c.pctToBase != null ? Number(c.pctToBase) : undefined,
              }))
            }
          } catch (allErr) {
            console.error('Failed to fetch from getAllCollaterals', allErr)
          }
        }

        setTemplate(items)
      } catch (err) {
        console.error('Failed to fetch collateral template', err)
        setError(
          t(
            'createCollateral.errors.failedFetchTemplate',
            'Failed to load collateral products template.'
          )
        )
      } finally {
        setLoadingTemplate(false)
      }
    }

    fetchClient()
    fetchTemplate()
  }, [clientId, isValidId, t])

  const selectedCollateral = template.find(
    item => String(item.collateralId) === selectedCollateralId
  )

  const quantityNum = Number(quantity) || 0
  const basePrice = selectedCollateral?.basePrice ?? 0
  const pctToBase = selectedCollateral?.pctToBase ?? 0
  const total = quantityNum * basePrice
  const totalCollateralValue = total * (pctToBase / 100)

  const backToClient = () => navigate(`/clients/${id}/general`)

  const onSubmit = async () => {
    if (!selectedCollateralId) {
      setError(
        t(
          'createCollateral.errors.collateralRequired',
          'Please select a collateral product.'
        )
      )
      return
    }
    if (quantityNum < 1) {
      setError(
        t('createCollateral.errors.quantityMin', 'Quantity must be at least 1.')
      )
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await collateralApi.addCollateral(clientId, {
        collateralId: Number(selectedCollateralId),
        quantity: quantityNum,
        locale: 'en',
      })

      const successState: RouteSuccessState = {
        message: 'Client collateral created successfully',
        successMessage: 'Client collateral created successfully',
      }
      navigate(`/clients/${id}/general`, { state: successState })
    } catch (err) {
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t(
            'createCollateral.errors.failedCreate',
            'Failed to create client collateral.'
          )
      )
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = Boolean(
    selectedCollateralId && quantityNum >= 1 && !submitting && !loadingTemplate
  )

  return (
    <div className="min-h-screen px-6 py-10 bg-zinc-50/50 dark:bg-zinc-900/50">
      {/* Top Header matching Angular Mifos UI */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 border-l-4 border-[#1074b9] pl-3 leading-tight">
          {client?.displayName || '...'}
        </h1>
        <div className="flex items-center text-sm gap-1.5 pl-3 mt-2 text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="text-[#1074b9] hover:underline cursor-pointer"
          >
            {t('title', 'Clients')}
          </button>
          <span>›</span>
          <button
            type="button"
            onClick={backToClient}
            className="text-[#1074b9] hover:underline cursor-pointer"
          >
            {client?.displayName || '...'}
          </button>
          <span>›</span>
          <span className="text-zinc-400 dark:text-zinc-500">
            {t('view.menu.createCollateral', 'Create Collateral')}
          </span>
        </div>
      </div>

      {/* Main Centered Card Container */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm p-8 mt-6">
        <div className="space-y-6">
          {error && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Collateral Product Select */}
          <div>
            <Select
              value={selectedCollateralId}
              onValueChange={val => {
                setSelectedCollateralId(val)
                setError(null)
              }}
              disabled={loadingTemplate || template.length === 0 || submitting}
            >
              <SelectTrigger
                id="collateralProduct"
                className="w-full h-14 bg-[#f5f5f5] dark:bg-zinc-700/50 border-0 border-b-2 border-zinc-300 dark:border-zinc-600 rounded-t-sm rounded-b-none px-4 text-left shadow-none focus:ring-0 focus:border-b-2 focus:border-[#1074b9]"
              >
                <div className="flex flex-col items-start justify-center flex-1">
                  {selectedCollateralId && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t('createCollateral.collateralType', 'Collateral')}*
                    </span>
                  )}
                  <SelectValue
                    placeholder={
                      loadingTemplate
                        ? t('loading', 'Loading...')
                        : template.length === 0
                          ? t(
                              'createCollateral.noCollateralFound',
                              'No collateral products available'
                            )
                          : `${t('createCollateral.collateralType', 'Collateral')}*`
                    }
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {template.map(item => (
                  <SelectItem
                    key={item.collateralId}
                    value={String(item.collateralId)}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingTemplate && template.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                {t(
                  'createCollateral.noCollateralFound',
                  'No collateral products available'
                )}
              </p>
            )}
          </div>

          {/* Extended Fields: Shown once Collateral is selected */}
          {selectedCollateral && (
            <div className="space-y-4 pt-1">
              {/* Base Price (Read-only) */}
              <div className="h-14 bg-[#f5f5f5] dark:bg-zinc-700/50 border-b-2 border-zinc-300 dark:border-zinc-600 rounded-t-sm px-4 flex flex-col justify-center">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t('createCollateral.basePrice', 'Base Price')}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(selectedCollateral.basePrice)}
                </span>
              </div>

              {/* Pct to Base (Read-only) */}
              <div className="h-14 bg-[#f5f5f5] dark:bg-zinc-700/50 border-b-2 border-zinc-300 dark:border-zinc-600 rounded-t-sm px-4 flex flex-col justify-center">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t('createCollateral.pctToBase', 'Pct to Base')}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedCollateral?.pctToBase != null
                    ? `${selectedCollateral.pctToBase}%`
                    : '—'}
                </span>
              </div>

              {/* Quantity (Required) */}
              <div className="h-14 bg-[#f5f5f5] dark:bg-zinc-700/50 border-b-2 border-zinc-300 dark:border-zinc-600 rounded-t-sm px-4 flex flex-col justify-center focus-within:border-[#1074b9]">
                <label
                  htmlFor="quantity"
                  className="text-[11px] text-zinc-500 dark:text-zinc-400 cursor-pointer"
                >
                  {t('createCollateral.quantity', 'Quantity')}*
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  step="1"
                  required
                  value={quantity}
                  onChange={e => {
                    setQuantity(e.target.value)
                    setError(null)
                  }}
                  disabled={submitting}
                  className="bg-transparent border-none outline-none p-0 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:ring-0"
                />
              </div>

              {/* Calculated Summary Box */}
              <div className="rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60 p-4 space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">
                    {t('createCollateral.total', 'Total')}:
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">
                    {t(
                      'createCollateral.totalCollateralValue',
                      'Total Collateral Value'
                    )}
                    :
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(totalCollateralValue)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Centered with Material styling */}
          <div className="flex justify-center items-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={backToClient}
              disabled={submitting}
              className="min-w-[80px] h-9 px-5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 shadow-sm rounded font-normal text-sm"
            >
              {t('createCollateral.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={
                canSubmit
                  ? 'min-w-[80px] h-9 px-5 bg-[#1074b9] hover:bg-[#0662a3] text-white shadow-sm rounded font-normal text-sm'
                  : 'min-w-[80px] h-9 px-5 bg-[#e0e0e0] dark:bg-zinc-700 text-[#9e9e9e] dark:text-zinc-400 cursor-not-allowed shadow-none rounded font-normal text-sm hover:bg-[#e0e0e0]'
              }
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('createCollateral.confirm', 'Submit')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateClientCollateral
