/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { format, subMonths } from 'date-fns'

import fineract from '@/lib/axios'

export type Office = { id: number; name: string; hierarchy: string }

/** A total per currency code, since balances in different currencies cannot be added */
export type CurrencyTotals = Record<string, number>

export type ClientsKpi = {
  total: number
  active: number
  pending: number
  newThisMonth: number
}

export type LoansKpi = {
  disbursed: number
  awaitingDisbursement: number
  amountCollected: number
  amountDue: number
}

export type DepositKind = 'savings' | 'fixed' | 'recurring'

export type DepositsKpi = Record<
  DepositKind,
  { total: number; active: number; balances: CurrencyTotals }
>

export type SharesKpi = { total: number; active: number }

/** Active accounts of each type, across all offices */
export type AccountMix = Record<
  'loans' | 'savings' | 'fixed' | 'recurring' | 'shares',
  number
>

export type TrendPoint = { period: string; newClients: number; loans: number }

export type DashboardData = {
  clients: ClientsKpi
  loans: LoansKpi
  deposits: DepositsKpi
  shares: SharesKpi
  accountMix: AccountMix
  trend: TrendPoint[]
}

type Page<T> = { totalFilteredRecords?: number; pageItems?: T[] }

type AccountItem = {
  status?: { active?: boolean }
  currency?: { code?: string }
  summary?: { accountBalance?: number }
}

type ReportRow = Record<string, string | number | null>

const PAGE_SIZE = 200

export const fetchOffices = async (): Promise<Office[]> => {
  const { data } = await fineract.get<Office[]>('v1/offices')
  return data ?? []
}

/** The number of matching records, read from a one-row page */
const countOf = async (path: string, params: Record<string, unknown>) => {
  const { data } = await fineract.get<Page<unknown>>(path, {
    params: { ...params, limit: 1 },
  })
  return data?.totalFilteredRecords ?? 0
}

/** Every item of a paged list, fetched a page at a time */
const fetchAllPages = async <T>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<T[]> => {
  const items: T[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data } = await fineract.get<Page<T>>(path, {
      params: { ...params, offset, limit: PAGE_SIZE },
    })
    const page = data?.pageItems ?? []
    items.push(...page)
    if (
      page.length < PAGE_SIZE ||
      items.length >= (data?.totalFilteredRecords ?? 0)
    )
      return items
  }
}

/**
 * A report column, matched without regard to case: the same report names its
 * columns `disbursedAmount` on MariaDB and `disbursedamount` on PostgreSQL.
 */
const column = (row: ReportRow | undefined, key: string) => {
  if (!row) return undefined
  const match = Object.keys(row).find(k => k.toLowerCase() === key)
  return match === undefined ? undefined : row[match]
}

const runReport = async (name: string, officeId: number) => {
  const { data } = await fineract.get<ReportRow[]>(
    `v1/runreports/${encodeURIComponent(name)}`,
    { params: { R_officeId: officeId, genericResultSet: false } }
  )
  return Array.isArray(data) ? data : []
}

const fetchClients = async (office: Office, newThisMonth: number) => {
  const params = { underHierarchy: office.hierarchy }
  const [total, active, pending] = await Promise.all([
    countOf('v1/clients', params),
    countOf('v1/clients', { ...params, status: 'active' }),
    countOf('v1/clients', { ...params, status: 'pending' }),
  ])
  return { total, active, pending, newThisMonth }
}

const summarise = (accounts: AccountItem[]) => {
  const balances: CurrencyTotals = {}
  let active = 0
  for (const account of accounts) {
    if (!account.status?.active) continue
    active += 1
    const code = account.currency?.code
    if (code)
      balances[code] =
        (balances[code] ?? 0) + Number(account.summary?.accountBalance ?? 0)
  }
  return { total: accounts.length, active, balances }
}

const fetchDeposits = async (): Promise<DepositsKpi> => {
  const [savings, fixed, recurring] = await Promise.all([
    fetchAllPages<AccountItem>('v1/savingsaccounts'),
    fetchAllPages<AccountItem>('v1/fixeddepositaccounts', { paged: true }),
    fetchAllPages<AccountItem>('v1/recurringdepositaccounts', { paged: true }),
  ])
  return {
    savings: summarise(savings),
    fixed: summarise(fixed),
    recurring: summarise(recurring),
  }
}

const fetchShares = async (): Promise<SharesKpi> => {
  const accounts = await fetchAllPages<AccountItem>('v1/accounts/share')
  return {
    total: accounts.length,
    active: accounts.filter(a => a.status?.active).length,
  }
}

/**
 * The last 12 months, oldest first. The trend reports only name the month, so
 * each row is matched to its month here rather than trusting the report order,
 * which puts January first even when it belongs to the current year.
 */
const buildTrend = (clientRows: ReportRow[], loanRows: ReportRow[]) => {
  const now = new Date()
  const byMonth = (rows: ReportRow[], key: string) =>
    new Map(
      rows.map(row => [
        String(column(row, 'months')),
        Number(column(row, key) ?? 0),
      ])
    )
  const clients = byMonth(clientRows, 'count')
  const loans = byMonth(loanRows, 'lcount')
  return Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, 11 - i)
    // The reports name months in English, as date-fns does by default
    const month = format(date, 'MMMM')
    return {
      period: format(date, 'yyyy-MM'),
      newClients: clients.get(month) ?? 0,
      loans: loans.get(month) ?? 0,
    }
  })
}

const amount = (rows: ReportRow[], key: string) =>
  Number(column(rows[0], key) ?? 0)

/**
 * Loads the overview for an office and the offices below it. Loan amounts and
 * client figures follow the office; deposit and share accounts cover all
 * offices, because their list APIs cannot filter by office.
 */
export const fetchDashboard = async (
  office: Office
): Promise<DashboardData> => {
  const [clientTrend, loanTrend, disbursal, collection] = await Promise.all([
    runReport('ClientTrendsByMonth', office.id),
    runReport('LoanTrendsByMonth', office.id),
    runReport('Disbursal Vs Awaitingdisbursal', office.id),
    runReport('Demand Vs Collection', office.id),
  ])
  const trend = buildTrend(clientTrend, loanTrend)

  const [clients, activeLoans, deposits, shares] = await Promise.all([
    fetchClients(office, trend[trend.length - 1].newClients),
    countOf('v1/loans', { status: 300 }),
    fetchDeposits(),
    fetchShares(),
  ])

  return {
    clients,
    loans: {
      disbursed: amount(disbursal, 'disbursedamount'),
      awaitingDisbursement: amount(disbursal, 'amounttobedisburse'),
      amountCollected: amount(collection, 'amountpaid'),
      amountDue: amount(collection, 'amountdue'),
    },
    deposits,
    shares,
    accountMix: {
      loans: activeLoans,
      savings: deposits.savings.active,
      fixed: deposits.fixed.active,
      recurring: deposits.recurring.active,
      shares: shares.active,
    },
    trend,
  }
}
