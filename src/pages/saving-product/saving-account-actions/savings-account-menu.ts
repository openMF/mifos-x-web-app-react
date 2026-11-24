/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Route segment of each savings account action, as used in
 * /{clients|groups}/:id/savings-accounts/:accountId/actions/<segment>,
 * mapped to its key in the `savings` translations (menu.<key>).
 */
export const SAVINGS_ACTIONS = {
  Approve: 'approve',
  Reject: 'reject',
  WithdrawnByClient: 'withdrawnByClient',
  Delete: 'delete',
  UndoApproval: 'undoApproval',
  Activate: 'activate',
  AddCharge: 'addCharge',
  AssignStaff: 'assignStaff',
  Deposit: 'deposit',
  Withdrawal: 'withdrawal',
  BlockAccount: 'blockAccount',
  UnblockAccount: 'unblockAccount',
  BlockDeposit: 'blockDeposit',
  UnblockDeposit: 'unblockDeposit',
  BlockWithdrawal: 'blockWithdrawal',
  UnblockWithdrawal: 'unblockWithdrawal',
  HoldAmount: 'holdAmount',
  CalculateInterest: 'calculateInterest',
  PostInterest: 'postInterest',
  PostInterestAsOn: 'postInterestAsOn',
  Close: 'close',
} as const

export type SavingsAction = keyof typeof SAVINGS_ACTIONS
export type SavingsActionKey = (typeof SAVINGS_ACTIONS)[SavingsAction]

export interface SavingsAccountStatus {
  submittedAndPendingApproval?: boolean
  pendingApproval?: boolean
  approved?: boolean
  active?: boolean
  value?: string
}

export interface SavingsAccountSubStatus {
  block?: boolean
  blockCredit?: boolean
  blockDebit?: boolean
}

export interface SavingsMenuItem {
  label: string
  path?: string
  children?: SavingsMenuItem[]
}

const ACCOUNT_PATH = /^\/?(clients|groups)\/([^/]+)\/savings-accounts\/([^/]+)/

/**
 * The account's own path, such as `clients/12/savings-accounts/34`, taken from
 * the current location so that links stay under the client or group the
 * account belongs to. Null when the location is not a savings account page.
 */
export function savingsAccountBasePath(pathname: string): string | null {
  const match = ACCOUNT_PATH.exec(pathname)
  return match ? `${match[1]}/${match[2]}/savings-accounts/${match[3]}` : null
}

/** The client or group page that owns the account, such as `clients/12`. */
export function savingsOwnerPath(pathname: string): string | null {
  const match = ACCOUNT_PATH.exec(pathname)
  return match ? `${match[1]}/${match[2]}` : null
}

/**
 * Builds the account menu for the account's status and sub-status, with the
 * same actions as the Angular web app. Each path points to
 * `<basePath>/actions/<segment>`.
 */
export function buildSavingsMenu(
  status: SavingsAccountStatus,
  subStatus: SavingsAccountSubStatus,
  basePath: string,
  label: (key: SavingsActionKey | 'more') => string
): SavingsMenuItem[] {
  const value = String(status.value ?? '').toLowerCase()
  const isPending = Boolean(
    status.pendingApproval ||
    status.submittedAndPendingApproval ||
    value.includes('pending')
  )
  const isApproved = Boolean(
    (status.approved && !status.active) || value === 'approved'
  )
  const isActive = Boolean(status.active)

  const item = (action: SavingsAction): SavingsMenuItem => ({
    label: label(SAVINGS_ACTIONS[action]),
    path: `${basePath}/actions/${action}`,
  })
  const more = (...actions: SavingsAction[]): SavingsMenuItem => ({
    label: label('more'),
    children: actions.map(item),
  })

  if (isPending) {
    return [
      item('Approve'),
      more('Reject', 'WithdrawnByClient', 'AddCharge', 'Delete', 'AssignStaff'),
    ]
  }

  if (isApproved) {
    return [
      item('UndoApproval'),
      item('Activate'),
      item('AddCharge'),
      more('AssignStaff'),
    ]
  }

  if (isActive) {
    return [
      item('Deposit'),
      item(subStatus.blockCredit ? 'UnblockDeposit' : 'BlockDeposit'),
      item('Withdrawal'),
      item(subStatus.blockDebit ? 'UnblockWithdrawal' : 'BlockWithdrawal'),
      item(subStatus.block ? 'UnblockAccount' : 'BlockAccount'),
      item('HoldAmount'),
      item('CalculateInterest'),
      item('PostInterestAsOn'),
      more('PostInterest', 'AddCharge', 'Close', 'AssignStaff'),
    ]
  }

  return [more('AssignStaff')]
}
