/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import en from '@/locales/en-US/savings.json'

import {
  SAVINGS_ACTIONS,
  buildSavingsMenu,
  savingsAccountBasePath,
  savingsOwnerPath,
  type SavingsMenuItem,
} from '../savings-account-menu'

const label = (key: string) => key
const base = 'clients/7/savings-accounts/42'

/** Route segments of every item, with `More` children flattened in. */
const segments = (items: SavingsMenuItem[]): string[] =>
  items.flatMap(item =>
    item.children
      ? segments(item.children)
      : [item.path!.replace(`${base}/actions/`, '')]
  )

describe('savingsAccountBasePath', () => {
  it('keeps the client or group that owns the account', () => {
    expect(
      savingsAccountBasePath('/clients/7/savings-accounts/42/transactions')
    ).toBe('clients/7/savings-accounts/42')
    expect(
      savingsAccountBasePath('/groups/3/savings-accounts/9/actions/Close')
    ).toBe('groups/3/savings-accounts/9')
    expect(savingsOwnerPath('/clients/7/savings-accounts/42/general')).toBe(
      'clients/7'
    )
  })

  it('returns null outside a savings account page', () => {
    expect(savingsAccountBasePath('/clients/7/general')).toBeNull()
    expect(savingsOwnerPath('/loans/1')).toBeNull()
  })
})

describe('buildSavingsMenu', () => {
  it('offers the pending application actions', () => {
    const menu = buildSavingsMenu(
      {
        submittedAndPendingApproval: true,
        value: 'Submitted and pending approval',
      },
      {},
      base,
      label
    )
    expect(segments(menu)).toEqual([
      'Approve',
      'Reject',
      'WithdrawnByClient',
      'AddCharge',
      'Delete',
      'AssignStaff',
    ])
  })

  it('offers undo approval and activation for an approved account', () => {
    const menu = buildSavingsMenu(
      { approved: true, value: 'Approved' },
      {},
      base,
      label
    )
    expect(segments(menu)).toEqual([
      'UndoApproval',
      'Activate',
      'AddCharge',
      'AssignStaff',
    ])
  })

  it('offers block actions on an active account with no block', () => {
    const menu = buildSavingsMenu(
      { active: true, value: 'Active' },
      { block: false, blockCredit: false, blockDebit: false },
      base,
      label
    )
    expect(segments(menu)).toEqual([
      'Deposit',
      'BlockDeposit',
      'Withdrawal',
      'BlockWithdrawal',
      'BlockAccount',
      'HoldAmount',
      'CalculateInterest',
      'PostInterestAsOn',
      'PostInterest',
      'AddCharge',
      'Close',
      'AssignStaff',
    ])
  })

  it('offers the matching unblock action for each block', () => {
    const blocked = (subStatus: Record<string, boolean>) =>
      segments(buildSavingsMenu({ active: true }, subStatus, base, label))

    expect(blocked({ block: true })).toContain('UnblockAccount')
    expect(blocked({ block: true })).not.toContain('BlockAccount')
    expect(blocked({ blockCredit: true })).toContain('UnblockDeposit')
    expect(blocked({ blockCredit: true })).not.toContain('BlockDeposit')
    expect(blocked({ blockDebit: true })).toContain('UnblockWithdrawal')
    expect(blocked({ blockDebit: true })).not.toContain('BlockWithdrawal')
  })

  it('links every item under the account it belongs to', () => {
    const menu = buildSavingsMenu({ active: true }, {}, base, label)
    const paths = menu.flatMap(i => (i.children ?? [i]).map(c => c.path))
    for (const path of paths) {
      expect(path).toMatch(/^clients\/7\/savings-accounts\/42\/actions\/\w+$/)
    }
  })

  it('labels items with their translation key', () => {
    const menu = buildSavingsMenu({ active: true }, {}, base, label)
    expect(menu[0].label).toBe('deposit')
    expect(menu.at(-1)?.label).toBe('more')
  })
})

describe('savings translations', () => {
  it('has a menu label for every action', () => {
    for (const key of Object.values(SAVINGS_ACTIONS)) {
      expect(en.menu[key]).toBeTruthy()
    }
  })
})
