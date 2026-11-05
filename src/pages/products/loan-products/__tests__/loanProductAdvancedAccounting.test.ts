/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import {
  ADVANCED_MAPPINGS,
  emptyMappingRow,
  incompleteMappings,
  mappingRows,
  readMappings,
  usedMappingValues,
  usesAdvancedMappings,
  withAdvancedMappings,
  withoutAccountMappings,
} from '../loanProductAccounting'

const byKey = (key: string) => ADVANCED_MAPPINGS.find(m => m.key === key)!
const fees = byKey('feeToIncomeAccountMappings')
const writeOff = byKey('writeOffReasonsToExpenseMappings')

describe('ADVANCED_MAPPINGS', () => {
  it('uses the names Fineract reads (LoanProductAccountingParams)', () => {
    expect(
      ADVANCED_MAPPINGS.map(m => [m.key, m.valueKey, m.accountKey])
    ).toEqual([
      [
        'paymentChannelToFundSourceMappings',
        'paymentTypeId',
        'fundSourceAccountId',
      ],
      ['feeToIncomeAccountMappings', 'chargeId', 'incomeAccountId'],
      ['penaltyToIncomeAccountMappings', 'chargeId', 'incomeAccountId'],
      [
        'chargeOffReasonToExpenseAccountMappings',
        'chargeOffReasonCodeValueId',
        'expenseAccountId',
      ],
      [
        'writeOffReasonsToExpenseMappings',
        'writeOffReasonCodeValueId',
        'expenseAccountId',
      ],
    ])
  })

  it('offers the GL accounts Fineract accepts for each table', () => {
    expect(ADVANCED_MAPPINGS.map(m => m.list)).toEqual([
      'asset',
      'incomeOrLiability',
      'income',
      'expense',
      'expense',
    ])
  })
})

describe('the advanced accounting rules box', () => {
  it('adds the five tables, empty, and removes them with their rows', () => {
    const on = withAdvancedMappings({ name: 'Micro loan' }, true)
    expect(usesAdvancedMappings(on)).toBe(true)
    ADVANCED_MAPPINGS.forEach(m => expect(on[m.key as never]).toEqual([]))

    const withRow = {
      ...on,
      feeToIncomeAccountMappings: [{ chargeId: 1, incomeAccountId: 9 }],
    }
    const off = withAdvancedMappings(withRow, false)
    expect(off).toEqual({ name: 'Micro loan' })
    expect(usesAdvancedMappings(off)).toBe(false)
  })

  it('keeps rows already chosen when it is ticked again', () => {
    const values = {
      feeToIncomeAccountMappings: [{ chargeId: 1, incomeAccountId: 9 }],
    }
    expect(mappingRows(withAdvancedMappings(values, true), fees)).toEqual([
      { chargeId: 1, incomeAccountId: 9 },
    ])
  })

  it('is cleared with the accounts when the accounting rule changes', () => {
    expect(
      withoutAccountMappings({
        accountingRule: 2,
        fundSourceAccountId: 1,
        paymentChannelToFundSourceMappings: [
          { paymentTypeId: 1, fundSourceAccountId: 6 },
        ],
        writeOffReasonsToExpenseMappings: [],
      })
    ).toEqual({ accountingRule: 2 })
  })
})

describe('mapping rows', () => {
  it('starts a row with nothing chosen', () => {
    expect(emptyMappingRow(writeOff)).toEqual({
      writeOffReasonCodeValueId: undefined,
      expenseAccountId: undefined,
    })
  })

  it('lists the values mapped in the other rows', () => {
    const rows = [
      { chargeId: 1, incomeAccountId: 9 },
      { chargeId: 2, incomeAccountId: 9 },
      { chargeId: undefined, incomeAccountId: undefined },
    ]
    expect([...usedMappingValues(rows, fees)]).toEqual([1, 2])
    expect([...usedMappingValues(rows, fees, 0)]).toEqual([2])
  })

  it('flags the tables with a row left half done', () => {
    expect(incompleteMappings(withAdvancedMappings({}, true))).toEqual([])
    expect(
      incompleteMappings({
        feeToIncomeAccountMappings: [{ chargeId: 1, incomeAccountId: 9 }],
        writeOffReasonsToExpenseMappings: [emptyMappingRow(writeOff)],
        penaltyToIncomeAccountMappings: [
          { chargeId: 3, incomeAccountId: undefined },
        ],
      }).map(m => m.key)
    ).toEqual([
      'penaltyToIncomeAccountMappings',
      'writeOffReasonsToExpenseMappings',
    ])
  })
})

describe('readMappings', () => {
  it('reads the rows of GET /loanproducts/{id}', () => {
    const product = {
      feeToIncomeAccountMappings: [
        {
          charge: { id: 1, name: 'Processing fee' },
          incomeAccount: { id: 9, name: 'Fee income', glCode: '4002' },
        },
      ],
      writeOffReasonsToExpenseMappings: [
        {
          reasonCodeValue: { id: 30, name: 'Death' },
          expenseAccount: { id: 12, name: 'Bad debts', glCode: '5001' },
        },
      ],
    }
    expect(readMappings(product, fees)).toEqual([
      {
        value: { id: 1, name: 'Processing fee' },
        account: { id: 9, name: 'Fee income', glCode: '4002' },
      },
    ])
    expect(readMappings(product, writeOff)[0].value?.name).toBe('Death')
    expect(
      readMappings(product, byKey('penaltyToIncomeAccountMappings'))
    ).toEqual([])
    expect(readMappings(null, fees)).toEqual([])
  })
})
