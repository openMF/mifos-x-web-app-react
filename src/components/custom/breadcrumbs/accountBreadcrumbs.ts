/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useLocation } from 'react-router-dom'

export interface AccountCrumb {
  label: string
  href?: string
  current?: boolean
}

type OwnerSegment = 'clients' | 'groups'
type AccountSegment = 'loans-accounts' | 'savings-accounts' | 'shares-accounts'

/** Owner prefixes under which an account view route is registered in AppRoutes. */
const ACCOUNT_VIEW_OWNERS: Record<AccountSegment, OwnerSegment[]> = {
  'loans-accounts': ['groups'],
  'savings-accounts': ['clients', 'groups'],
  'shares-accounts': ['clients'],
}

const OWNER_LABELS: Record<OwnerSegment, { list: string; single: string }> = {
  clients: { list: 'Clients', single: 'Client' },
  groups: { list: 'Groups', single: 'Group' },
}

const ACCOUNT_LABELS: Record<AccountSegment, string> = {
  'loans-accounts': 'Loan Account',
  'savings-accounts': 'Savings Account',
  'shares-accounts': 'Shares Account',
}

/** Tab routes of the loan, savings and shares account views. */
const ACCOUNT_TAB_LABELS: Record<string, string> = {
  general: 'General',
  accountdetail: 'Account Details',
  'repayment-schedule': 'Repayment Schedule',
  transactions: 'Transactions',
  'loan-collateral': 'Loan Collateral Details',
  'term-variations': 'Term Variations',
  'loan-documents': 'Loan Documents',
  charges: 'Charges',
  documents: 'Documents',
  dividends: 'Dividends',
  notes: 'Notes',
}

const ACCOUNT_PATH =
  /^\/(clients|groups)\/([^/]+)\/(loans-accounts|savings-accounts|shares-accounts)\/([^/]+)(?:\/actions\/([^/]+)|\/([^/]+))?/

/** Turns a route segment such as `GoodwillCredit` or `Charge-Off` into `Goodwill Credit` / `Charge Off`. */
export const humanizeSegment = (segment: string) =>
  segment
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

export interface AccountBreadcrumbOptions {
  /** Name of the client or group, when the page has already loaded it. */
  ownerLabel?: string
  /** Label for the account crumb (for example the account number), when loaded. */
  accountLabel?: string
  /**
   * Label of the action crumb. A string is used as is; a map is looked up by
   * the `/actions/:segment` part of the URL. Falls back to a readable form of
   * that segment. Ignored on account view pages (no action segment).
   */
  actionLabel?: string | Record<string, string>
}

/**
 * Builds `Home / Clients|Groups / owner / account [/ tab | / action]` from a
 * pathname.
 * Ids are read from the path rather than route params because the loan action
 * routes declare `:id` twice, so `useParams().id` only holds the loan id.
 */
export const buildAccountBreadcrumbs = (
  pathname: string,
  { ownerLabel, accountLabel, actionLabel }: AccountBreadcrumbOptions = {}
): AccountCrumb[] => {
  const match = ACCOUNT_PATH.exec(pathname)
  if (!match) return [{ label: 'Home', href: '/home' }]

  const owner = match[1] as OwnerSegment
  const ownerId = match[2]
  const account = match[3] as AccountSegment
  const accountId = match[4]
  const actionSegment = match[5]
  const tabLabel = match[6] ? ACCOUNT_TAB_LABELS[match[6]] : undefined

  const hasAccountView = ACCOUNT_VIEW_OWNERS[account].includes(owner)
  const crumbs: AccountCrumb[] = [
    { label: 'Home', href: '/home' },
    { label: OWNER_LABELS[owner].list, href: `/${owner}` },
    {
      label: ownerLabel || OWNER_LABELS[owner].single,
      href: `/${owner}/${ownerId}/general`,
    },
    {
      label: accountLabel || ACCOUNT_LABELS[account],
      href: hasAccountView
        ? `/${owner}/${ownerId}/${account}/${accountId}/general`
        : undefined,
    },
  ]

  if (tabLabel) crumbs.push({ label: tabLabel })

  if (actionSegment) {
    const label =
      typeof actionLabel === 'string'
        ? actionLabel
        : actionLabel?.[actionSegment]
    crumbs.push({ label: label || humanizeSegment(actionSegment) })
  }

  return crumbs
}

/** Hook form of {@link buildAccountBreadcrumbs} for the current location. */
export const useAccountBreadcrumbs = (
  options: AccountBreadcrumbOptions = {}
): AccountCrumb[] => {
  const { pathname } = useLocation()
  return buildAccountBreadcrumbs(pathname, options)
}
