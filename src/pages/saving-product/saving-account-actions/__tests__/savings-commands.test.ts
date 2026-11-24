/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import en from '@/locales/en-US/savings.json'

import { SAVINGS_ACTIONS } from '../savings-account-menu'
import {
  EMPTY_COMMAND_VALUES,
  SAVINGS_COMMANDS,
  buildCommandPayload,
  canSubmitCommand,
  isConfirmOnly,
  isSavingsCommandAction,
  reasonForOptions,
  type SavingsCommandAction,
} from '../savings-account-command/savings-commands'

const values = (patch: Partial<typeof EMPTY_COMMAND_VALUES> = {}) => ({
  ...EMPTY_COMMAND_VALUES,
  ...patch,
})

describe('isSavingsCommandAction', () => {
  it('accepts the actions handled by the shared page only', () => {
    expect(isSavingsCommandAction('Close')).toBe(true)
    expect(isSavingsCommandAction('HoldAmount')).toBe(true)
    expect(isSavingsCommandAction('Deposit')).toBe(false)
    expect(isSavingsCommandAction('toString')).toBe(false)
    expect(isSavingsCommandAction(undefined)).toBe(false)
  })
})

describe('SAVINGS_COMMANDS', () => {
  it('uses the Fineract commands for each action', () => {
    const commands = Object.fromEntries(
      Object.entries(SAVINGS_COMMANDS).map(([action, c]) => [
        action,
        `${c.endpoint}:${c.command ?? ''}`,
      ])
    )
    expect(commands).toEqual({
      WithdrawnByClient: 'account:withdrawnByApplicant',
      Delete: 'delete:',
      BlockAccount: 'account:block',
      UnblockAccount: 'account:unblock',
      BlockDeposit: 'account:blockCredit',
      UnblockDeposit: 'account:unblockCredit',
      BlockWithdrawal: 'account:blockDebit',
      UnblockWithdrawal: 'account:unblockDebit',
      HoldAmount: 'transaction:holdAmount',
      CalculateInterest: 'account:calculateInterest',
      PostInterest: 'account:postInterest',
      PostInterestAsOn: 'transaction:postInterestAsOn',
      Close: 'account:close',
    })
  })

  it('has a confirmation message for every action without inputs', () => {
    const confirm = en.confirm as Record<string, string>
    for (const [action, config] of Object.entries(SAVINGS_COMMANDS)) {
      if (!isConfirmOnly(config)) continue
      const key = SAVINGS_ACTIONS[action as SavingsCommandAction]
      expect(confirm[key], action).toBeTruthy()
    }
  })
})

describe('buildCommandPayload', () => {
  it('sends an empty body for actions without inputs', () => {
    for (const action of [
      'UnblockAccount',
      'CalculateInterest',
      'PostInterest',
    ] as const) {
      expect(buildCommandPayload(SAVINGS_COMMANDS[action], values())).toEqual(
        {}
      )
    }
  })

  it('sends the reason for a block', () => {
    expect(
      buildCommandPayload(
        SAVINGS_COMMANDS.BlockAccount,
        values({ reason: '  Fraud  ', note: 'ignored' })
      )
    ).toEqual({ reasonForBlock: 'Fraud' })
  })

  it('sends date, amount and reason for a hold', () => {
    expect(
      buildCommandPayload(
        SAVINGS_COMMANDS.HoldAmount,
        values({ date: '2026-11-03', amount: '100.50', reason: 'Court order' })
      )
    ).toEqual({
      transactionDate: '2026-11-03',
      transactionAmount: 100.5,
      reasonForBlock: 'Court order',
      locale: 'en',
      dateFormat: 'yyyy-MM-dd',
    })
  })

  it('sends the withdrawn date and note', () => {
    expect(
      buildCommandPayload(
        SAVINGS_COMMANDS.WithdrawnByClient,
        values({ date: '2026-11-05', note: ' changed mind ' })
      )
    ).toEqual({
      withdrawnOnDate: '2026-11-05',
      note: 'changed mind',
      locale: 'en',
      dateFormat: 'yyyy-MM-dd',
    })
  })

  it('sends the payment type only when closing with a withdrawal', () => {
    const close = SAVINGS_COMMANDS.Close
    expect(
      buildCommandPayload(
        close,
        values({ date: '2026-11-20', paymentTypeId: '1' })
      )
    ).toEqual({
      closedOnDate: '2026-11-20',
      withdrawBalance: false,
      postInterestValidationOnClosure: true,
      locale: 'en',
      dateFormat: 'yyyy-MM-dd',
    })
    expect(
      buildCommandPayload(
        close,
        values({
          date: '2026-11-20',
          withdrawBalance: true,
          paymentTypeId: '3',
          postInterestValidationOnClosure: false,
        })
      )
    ).toMatchObject({
      withdrawBalance: true,
      paymentTypeId: 3,
      postInterestValidationOnClosure: false,
    })
  })
})

describe('reasonForOptions', () => {
  it('keeps a reason that is one of the loaded options', () => {
    expect(reasonForOptions('Fraud', ['Fraud', 'Court order'])).toBe('Fraud')
  })

  it('clears a typed reason that the loaded options do not contain', () => {
    expect(reasonForOptions('typed text', ['Fraud'])).toBe('')
  })

  it('keeps the typed reason when there are no options', () => {
    expect(reasonForOptions('typed text', [])).toBe('typed text')
  })
})

describe('canSubmitCommand', () => {
  it('needs a date, a positive amount and a reason for a hold', () => {
    const hold = SAVINGS_COMMANDS.HoldAmount
    const full = values({ date: '2026-11-03', amount: '10', reason: 'x' })
    expect(canSubmitCommand(hold, full)).toBe(true)
    expect(canSubmitCommand(hold, { ...full, date: '' })).toBe(false)
    expect(canSubmitCommand(hold, { ...full, amount: '0' })).toBe(false)
    expect(canSubmitCommand(hold, { ...full, reason: '   ' })).toBe(false)
  })

  it('needs a payment type when closing with a withdrawal', () => {
    const close = SAVINGS_COMMANDS.Close
    const base = values({ date: '2026-11-20' })
    expect(canSubmitCommand(close, base)).toBe(true)
    expect(canSubmitCommand(close, { ...base, withdrawBalance: true })).toBe(
      false
    )
    expect(
      canSubmitCommand(close, {
        ...base,
        withdrawBalance: true,
        paymentTypeId: '1',
      })
    ).toBe(true)
  })

  it('always allows confirmation-only actions', () => {
    expect(canSubmitCommand(SAVINGS_COMMANDS.Delete, values())).toBe(true)
  })
})
