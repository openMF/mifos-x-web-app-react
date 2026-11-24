/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { SavingsAction } from '../savings-account-menu'

/**
 * How one savings account action is sent to Fineract:
 * - `account`: POST /savingsaccounts/{id}?command=<command>
 * - `transaction`: POST /savingsaccounts/{id}/transactions?command=<command>
 * - `delete`: DELETE /savingsaccounts/{id}
 */
export interface SavingsCommandConfig {
  endpoint: 'account' | 'transaction' | 'delete'
  command?: string
  /** Name of the date field Fineract expects, when the action takes a date. */
  dateField?: 'closedOnDate' | 'withdrawnOnDate' | 'transactionDate'
  /** The action takes a transaction amount. */
  amount?: boolean
  /** Fineract code whose values are offered as the reason (sent as reasonForBlock). */
  reasonCode?: string
  /** The action takes an optional note. */
  note?: boolean
  /** Close: withdraw balance, interest posting check and payment type. */
  close?: boolean
  /** Where to go after success: the account, or the client or group (after Delete). */
  after: 'account' | 'owner'
}

export type SavingsCommandAction = Extract<
  SavingsAction,
  | 'WithdrawnByClient'
  | 'Delete'
  | 'BlockAccount'
  | 'UnblockAccount'
  | 'BlockDeposit'
  | 'UnblockDeposit'
  | 'BlockWithdrawal'
  | 'UnblockWithdrawal'
  | 'HoldAmount'
  | 'CalculateInterest'
  | 'PostInterest'
  | 'PostInterestAsOn'
  | 'Close'
>

export const SAVINGS_COMMANDS: Record<
  SavingsCommandAction,
  SavingsCommandConfig
> = {
  WithdrawnByClient: {
    endpoint: 'account',
    command: 'withdrawnByApplicant',
    dateField: 'withdrawnOnDate',
    note: true,
    after: 'account',
  },
  Delete: { endpoint: 'delete', after: 'owner' },
  BlockAccount: {
    endpoint: 'account',
    command: 'block',
    reasonCode: 'SavingsAccountBlockReasons',
    after: 'account',
  },
  UnblockAccount: { endpoint: 'account', command: 'unblock', after: 'account' },
  BlockDeposit: {
    endpoint: 'account',
    command: 'blockCredit',
    reasonCode: 'CreditTransactionFreezeReasons',
    after: 'account',
  },
  UnblockDeposit: {
    endpoint: 'account',
    command: 'unblockCredit',
    after: 'account',
  },
  BlockWithdrawal: {
    endpoint: 'account',
    command: 'blockDebit',
    reasonCode: 'DebitTransactionFreezeReasons',
    after: 'account',
  },
  UnblockWithdrawal: {
    endpoint: 'account',
    command: 'unblockDebit',
    after: 'account',
  },
  HoldAmount: {
    endpoint: 'transaction',
    command: 'holdAmount',
    dateField: 'transactionDate',
    amount: true,
    reasonCode: 'SavingsTransactionFreezeReasons',
    after: 'account',
  },
  CalculateInterest: {
    endpoint: 'account',
    command: 'calculateInterest',
    after: 'account',
  },
  PostInterest: {
    endpoint: 'account',
    command: 'postInterest',
    after: 'account',
  },
  PostInterestAsOn: {
    endpoint: 'transaction',
    command: 'postInterestAsOn',
    dateField: 'transactionDate',
    after: 'account',
  },
  Close: {
    endpoint: 'account',
    command: 'close',
    dateField: 'closedOnDate',
    close: true,
    note: true,
    after: 'account',
  },
}

export function isSavingsCommandAction(
  action: string | undefined
): action is SavingsCommandAction {
  return Boolean(
    action && Object.prototype.hasOwnProperty.call(SAVINGS_COMMANDS, action)
  )
}

/** True when the action has no inputs and only needs a confirmation. */
export function isConfirmOnly(config: SavingsCommandConfig): boolean {
  return (
    !config.dateField && !config.amount && !config.reasonCode && !config.note
  )
}

export interface SavingsCommandValues {
  /** Date input value, yyyy-MM-dd. */
  date: string
  amount: string
  reason: string
  note: string
  withdrawBalance: boolean
  postInterestValidationOnClosure: boolean
  paymentTypeId: string
}

export const EMPTY_COMMAND_VALUES: SavingsCommandValues = {
  date: '',
  amount: '',
  reason: '',
  note: '',
  withdrawBalance: false,
  postInterestValidationOnClosure: true,
  paymentTypeId: '',
}

/**
 * The reason to keep once the reason options have loaded. With options, the
 * reason is picked from a select, so a value that is not one of them is
 * cleared. With no options, the reason stays free text.
 */
export function reasonForOptions(reason: string, options: string[]): string {
  if (options.length === 0) return reason
  return options.includes(reason) ? reason : ''
}

/** Whether the form has everything Fineract needs for this action. */
export function canSubmitCommand(
  config: SavingsCommandConfig,
  values: SavingsCommandValues
): boolean {
  if (config.dateField && !values.date) return false
  if (config.amount && !(Number(values.amount) > 0)) return false
  if (config.reasonCode && !values.reason.trim()) return false
  if (config.close && values.withdrawBalance && !values.paymentTypeId)
    return false
  return true
}

/** The request body for the action, in the shape Fineract expects. */
export function buildCommandPayload(
  config: SavingsCommandConfig,
  values: SavingsCommandValues
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (config.dateField) {
    payload[config.dateField] = values.date
    payload.locale = 'en'
    payload.dateFormat = 'yyyy-MM-dd'
  }
  if (config.amount) {
    payload.transactionAmount = Number(values.amount)
    payload.locale = 'en'
  }
  if (config.reasonCode) {
    payload.reasonForBlock = values.reason.trim()
  }
  if (config.close) {
    payload.withdrawBalance = values.withdrawBalance
    payload.postInterestValidationOnClosure =
      values.postInterestValidationOnClosure
    if (values.withdrawBalance && values.paymentTypeId) {
      payload.paymentTypeId = Number(values.paymentTypeId)
    }
  }
  if (config.note && values.note.trim()) {
    payload.note = values.note.trim()
  }

  return payload
}
