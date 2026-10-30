/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CurrencyApi,
  OfficesApi,
  type CurrencyData,
  type GetOfficesResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import fineract from '@/lib/axios'
import { businessDateInputValue } from '@/lib/business-date'
import { inputToFineractDate } from '@/lib/date-utils'

interface OpeningBalanceAccount {
  glAccountId: number
  glAccountCode?: string
  glAccountName: string
  glAccountType?: {
    value?: string
  }
}

interface OpeningBalancesResponse {
  contraAccount: OpeningBalanceAccount
  assetAccountOpeningBalances: OpeningBalanceAccount[]
  liabityAccountOpeningBalances: OpeningBalanceAccount[]
  equityAccountOpeningBalances: OpeningBalanceAccount[]
  incomeAccountOpeningBalances: OpeningBalanceAccount[]
  expenseAccountOpeningBalances: OpeningBalanceAccount[]
}

interface OpeningBalanceEntry {
  glAccountId: number
  debit: string
  credit: string
}

interface FineractErrorResponse {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    developerMessage?: string
  }>
}

const officeApi = new OfficesApi(getConfiguration())
const currencyApi = new CurrencyApi(getConfiguration())

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<FineractErrorResponse>(error)) return fallback
  const response = error.response?.data
  const details = response?.errors?.find(
    item => item.defaultUserMessage || item.developerMessage
  )
  return (
    details?.defaultUserMessage ||
    details?.developerMessage ||
    response?.defaultUserMessage ||
    response?.developerMessage ||
    fallback
  )
}

const accountTypeLabels: Record<string, string> = {
  ASSET: 'Assets',
  LIABILITY: 'Liabilities',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expenses',
}

const MigrateOpeningBalances = () => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [currencies, setCurrencies] = useState<CurrencyData[]>([])
  const [officeId, setOfficeId] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [transactionDate, setTransactionDate] = useState('')
  const [maxDate, setMaxDate] = useState('')
  const [openingBalances, setOpeningBalances] =
    useState<OpeningBalancesResponse | null>(null)
  const [entries, setEntries] = useState<OpeningBalanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [canDefineOpeningBalance, setCanDefineOpeningBalance] = useState(false)
  const [permissionError, setPermissionError] = useState('')
  const [error, setError] = useState('')
  const retrievalRequestId = useRef(0)

  useEffect(() => {
    let active = true

    const loadFormData = async () => {
      try {
        const [officesResponse, currenciesResponse, businessDate] =
          await Promise.all([
            officeApi.retrieveOffices(),
            currencyApi.retrieveCurrencies(),
            businessDateInputValue(),
          ])
        if (!active) return
        setOffices(officesResponse.data ?? [])
        setCurrencies(currenciesResponse.data.selectedCurrencyOptions ?? [])
        setMaxDate(businessDate)
      } catch (loadError) {
        console.error('Failed to load opening balance form data', loadError)
        if (active) {
          setError(
            getApiErrorMessage(
              loadError,
              'Unable to load offices and currencies.'
            )
          )
        }
      }

      try {
        const userDetailsResponse = await fineract.get<{
          permissions?: string[]
        }>('v1/self/userdetails')
        if (active) {
          const permissions = userDetailsResponse.data.permissions ?? []
          setCanDefineOpeningBalance(
            permissions.includes('ALL_FUNCTIONS') ||
              permissions.includes('DEFINEOPENINGBALANCE_JOURNALENTRY')
          )
        }
      } catch (permissionError) {
        console.error(
          'Failed to load opening balance permission',
          permissionError
        )
        if (active) {
          setPermissionError(
            getApiErrorMessage(
              permissionError,
              'Unable to verify permission to submit opening balances.'
            )
          )
        }
      }
    }

    void loadFormData()
    return () => {
      active = false
    }
  }, [])

  const accounts = useMemo(() => {
    if (!openingBalances) return []
    return [
      ...openingBalances.assetAccountOpeningBalances,
      ...openingBalances.liabityAccountOpeningBalances,
      ...openingBalances.equityAccountOpeningBalances,
      ...openingBalances.incomeAccountOpeningBalances,
      ...openingBalances.expenseAccountOpeningBalances,
    ]
  }, [openingBalances])

  const debitTotal = entries.reduce(
    (sum, entry) => sum + (Number(entry.debit) || 0),
    0
  )
  const creditTotal = entries.reduce(
    (sum, entry) => sum + (Number(entry.credit) || 0),
    0
  )
  const currencyDecimalPlaces =
    currencies.find(currency => currency.code === currencyCode)
      ?.decimalPlaces ?? 2
  const amountScale = 10 ** currencyDecimalPlaces
  const debitTotalInMinorUnits = entries.reduce(
    (sum, entry) => sum + Math.round((Number(entry.debit) || 0) * amountScale),
    0
  )
  const creditTotalInMinorUnits = entries.reduce(
    (sum, entry) => sum + Math.round((Number(entry.credit) || 0) * amountScale),
    0
  )
  const amountsAreBalanced =
    debitTotal > 0 && debitTotalInMinorUnits === creditTotalInMinorUnits
  const entriesAreValid = entries.every(entry => {
    const debit = Number(entry.debit)
    const credit = Number(entry.credit)
    const hasDebit = debit > 0
    const hasCredit = credit > 0
    return (
      Number.isFinite(debit) &&
      Number.isFinite(credit) &&
      debit >= 0 &&
      credit >= 0 &&
      !(hasDebit && hasCredit)
    )
  })

  const retrieveOpeningBalances = async (
    requestedOfficeId = officeId,
    requestedCurrencyCode = currencyCode
  ) => {
    if (!requestedOfficeId || !requestedCurrencyCode) {
      setError('Please select an office and currency.')
      return
    }
    const requestId = ++retrievalRequestId.current
    setError('')
    setLoading(true)
    setOpeningBalances(null)
    setEntries([])
    setTransactionDate('')

    try {
      const response = await fineract.get<OpeningBalancesResponse>(
        'v1/journalentries/openingbalance',
        {
          params: {
            officeId: requestedOfficeId,
            currencyCode: requestedCurrencyCode,
          },
        }
      )
      if (requestId !== retrievalRequestId.current) return
      const data = response.data
      const glAccounts = [
        ...(data.assetAccountOpeningBalances ?? []),
        ...(data.liabityAccountOpeningBalances ?? []),
        ...(data.equityAccountOpeningBalances ?? []),
        ...(data.incomeAccountOpeningBalances ?? []),
        ...(data.expenseAccountOpeningBalances ?? []),
      ]
      setOpeningBalances({
        ...data,
        assetAccountOpeningBalances: data.assetAccountOpeningBalances ?? [],
        liabityAccountOpeningBalances: data.liabityAccountOpeningBalances ?? [],
        equityAccountOpeningBalances: data.equityAccountOpeningBalances ?? [],
        incomeAccountOpeningBalances: data.incomeAccountOpeningBalances ?? [],
        expenseAccountOpeningBalances: data.expenseAccountOpeningBalances ?? [],
      })
      setEntries(
        glAccounts.map(account => ({
          glAccountId: account.glAccountId,
          debit: '',
          credit: '',
        }))
      )
    } catch (retrieveError) {
      if (requestId !== retrievalRequestId.current) return
      console.error('Failed to retrieve opening balances', retrieveError)
      setError(
        getApiErrorMessage(
          retrieveError,
          'Unable to retrieve opening balances for this office and currency.'
        )
      )
    } finally {
      if (requestId === retrievalRequestId.current) {
        setLoading(false)
      }
    }
  }

  const updateEntry = (
    index: number,
    field: 'debit' | 'credit',
    value: string
  ) => {
    setEntries(current =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    )
  }

  const submitOpeningBalances = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!openingBalances || !officeId || !currencyCode || !transactionDate) {
      setError(
        'Please complete the office, currency, and opening balances date.'
      )
      return
    }
    if (!entriesAreValid || !amountsAreBalanced) {
      setError(
        'Enter a debit or credit for each account, or leave both blank, and make sure total debits equal total credits.'
      )
      return
    }

    setError('')
    setSubmitting(true)
    const payload = {
      officeId: Number(officeId),
      currencyCode,
      transactionDate: inputToFineractDate(transactionDate),
      dateFormat: 'dd MMMM yyyy',
      locale: 'en',
      debits: entries
        .filter(entry => Number(entry.debit) > 0)
        .map(entry => ({
          glAccountId: entry.glAccountId,
          amount: Number(entry.debit),
        })),
      credits: entries
        .filter(entry => Number(entry.credit) > 0)
        .map(entry => ({
          glAccountId: entry.glAccountId,
          amount: Number(entry.credit),
        })),
    }

    try {
      const response = await fineract.post<{ transactionId: string | number }>(
        'v1/journalentries',
        payload,
        { params: { command: 'defineOpeningBalance' } }
      )
      if (!response.data.transactionId) {
        setError(
          'Opening balances were submitted, but the server did not return a transaction ID.'
        )
        return
      }
      navigate(
        `/accounting/journal-entries/transactions/view/${encodeURIComponent(response.data.transactionId)}`
      )
    } catch (submitError) {
      console.error('Failed to define opening balances', submitError)
      setError(
        getApiErrorMessage(
          submitError,
          'Unable to submit opening balances. Please try again.'
        )
      )
    } finally {
      setSubmitting(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currencyCode || 'USD',
      currencyDisplay: 'narrowSymbol',
    }).format(amount)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <h1 className="mb-4 border-l-4 border-indigo-500 pl-4 text-3xl font-semibold">
        Migrate Opening Balances
      </h1>
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Migrate Opening Balances', current: true },
        ]}
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="max-w-xs">
          <AppSelect
            selectLabel="Office*"
            selectValue={officeId}
            selectOnChange={value => {
              retrievalRequestId.current += 1
              setOfficeId(value)
              setOpeningBalances(null)
              setEntries([])
              setTransactionDate('')
              setLoading(false)
              setError('')
            }}
            selectPlaceholder="Select office"
            selectOptions={offices
              .filter(office => office.id !== undefined)
              .map(office => ({
                id: office.id!,
                name: office.name ?? '',
              }))}
            selectClassname="w-full"
          />
        </div>
        <div className="mt-6 max-w-xs space-y-2">
          <Label htmlFor="opening-balance-currency">Currency *</Label>
          <select
            id="opening-balance-currency"
            required
            value={currencyCode}
            onChange={event => {
              const nextCurrencyCode = event.target.value
              retrievalRequestId.current += 1
              setCurrencyCode(nextCurrencyCode)
              setOpeningBalances(null)
              setEntries([])
              setTransactionDate('')
              setLoading(false)
              setError('')
              if (officeId && nextCurrencyCode) {
                void retrieveOpeningBalances(officeId, nextCurrencyCode)
              }
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select currency</option>
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.displayLabel}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6">
          <Button
            type="button"
            className="bg-[#1074b9] text-white hover:bg-[#1074c9]"
            onClick={() => void retrieveOpeningBalances()}
            disabled={loading}
          >
            {loading ? 'Retrieving…' : 'Retrieve'}
          </Button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
        {permissionError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {permissionError}
          </p>
        )}
        {openingBalances && !canDefineOpeningBalance && !permissionError && (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
            You do not have permission to define opening balances.
          </p>
        )}

        {openingBalances && (
          <form className="mt-8 space-y-6" onSubmit={submitOpeningBalances}>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="mb-2 font-semibold">
                Opening Balances Contra Account
              </h2>
              <p>
                {openingBalances.contraAccount?.glAccountCode
                  ? `${openingBalances.contraAccount.glAccountCode} - `
                  : ''}
                {openingBalances.contraAccount?.glAccountName ?? '—'}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opening-balance-date">
                  Opening Balances Date *
                </Label>
                <Input
                  id="opening-balance-date"
                  type="date"
                  min="2000-01-01"
                  max={maxDate || undefined}
                  required
                  value={transactionDate}
                  onChange={event => setTransactionDate(event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[0.7fr_1fr_1.5fr_1fr_1fr] gap-4 border-b border-zinc-200 pb-3 font-semibold dark:border-zinc-700 max-md:grid-cols-1">
              <span>Type</span>
              <span>GL Code</span>
              <span>GL Name Account</span>
              <span className="text-right">
                Total Debit: {formatAmount(debitTotal)}
              </span>
              <span className="text-right">
                Total Credit: {formatAmount(creditTotal)}
              </span>
            </div>

            {accounts.map((account, index) => {
              const type = account.glAccountType?.value ?? ''
              const previousType = accounts[index - 1]?.glAccountType?.value
              return (
                <div
                  key={`${account.glAccountId}-${index}`}
                  className="grid grid-cols-[0.7fr_1fr_1.5fr_1fr_1fr] items-center gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-700 max-md:grid-cols-1"
                >
                  <span className="font-medium">
                    {type !== previousType
                      ? (accountTypeLabels[type] ?? type)
                      : ''}
                  </span>
                  <span>{account.glAccountCode ?? '—'}</span>
                  <span>{account.glAccountName}</span>
                  <div className="space-y-2">
                    <Label htmlFor={`debit-${index}`}>Debit</Label>
                    <Input
                      id={`debit-${index}`}
                      type="number"
                      min="0"
                      step="any"
                      value={entries[index]?.debit ?? ''}
                      onChange={event =>
                        updateEntry(index, 'debit', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`credit-${index}`}>Credit</Label>
                    <Input
                      id={`credit-${index}`}
                      type="number"
                      min="0"
                      step="any"
                      value={entries[index]?.credit ?? ''}
                      onChange={event =>
                        updateEntry(index, 'credit', event.target.value)
                      }
                    />
                  </div>
                </div>
              )
            })}

            <div className="flex justify-end gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/accounting')}
                disabled={submitting}
              >
                Cancel
              </Button>
              {canDefineOpeningBalance && (
                <Button
                  type="submit"
                  className="bg-[#1074b9] text-white hover:bg-[#1074c9]"
                  disabled={
                    submitting ||
                    !currencyCode ||
                    !transactionDate ||
                    !entriesAreValid ||
                    !amountsAreBalanced
                  }
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default MigrateOpeningBalances
