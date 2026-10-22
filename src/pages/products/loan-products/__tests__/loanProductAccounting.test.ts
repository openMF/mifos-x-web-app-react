/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import {
  ACCOUNTING_RULE,
  accountingFieldsFor,
  glAccountLabel,
  mappingKey,
  missingAccounts,
  ruleLabel,
  withoutAccountMappings,
} from '../loanProductAccounting'

const keys = (rule: number) => accountingFieldsFor(rule).map(f => f.key)

// The accounts LoanProductDataValidator requires for Cash and both Accruals
const REQUIRED_ANY = [
  'fundSourceAccountId',
  'loanPortfolioAccountId',
  'transfersInSuspenseAccountId',
  'interestOnLoanAccountId',
  'incomeFromFeeAccountId',
  'incomeFromPenaltyAccountId',
  'incomeFromRecoveryAccountId',
  'writeOffAccountId',
  'overpaymentLiabilityAccountId',
]
const REQUIRED_ACCRUAL = [
  'receivableInterestAccountId',
  'receivableFeeAccountId',
  'receivablePenaltyAccountId',
]

describe('accountingFieldsFor', () => {
  it('shows no accounts for None', () => {
    expect(keys(ACCOUNTING_RULE.none)).toEqual([])
  })

  it('leaves the receivables out for Cash', () => {
    const cash = keys(ACCOUNTING_RULE.cash)
    expect(cash).toEqual(expect.arrayContaining(REQUIRED_ANY))
    REQUIRED_ACCRUAL.forEach(k => expect(cash).not.toContain(k))
  })

  it('adds the receivables for both Accruals', () => {
    for (const rule of [
      ACCOUNTING_RULE.accrualPeriodic,
      ACCOUNTING_RULE.accrualUpfront,
    ]) {
      expect(keys(rule)).toEqual(
        expect.arrayContaining([...REQUIRED_ANY, ...REQUIRED_ACCRUAL])
      )
    }
  })
})

describe('missingAccounts', () => {
  const all = Object.fromEntries(
    [...REQUIRED_ANY, ...REQUIRED_ACCRUAL].map((k, i) => [k, i + 1])
  )

  it('lists the 9 required accounts for an empty Cash product', () => {
    expect(missingAccounts(ACCOUNTING_RULE.cash, {}).map(f => f.key)).toEqual(
      expect.arrayContaining(REQUIRED_ANY)
    )
    expect(missingAccounts(ACCOUNTING_RULE.cash, {})).toHaveLength(9)
  })

  it('needs 12 for Accrual and nothing once they are chosen', () => {
    expect(missingAccounts(ACCOUNTING_RULE.accrualPeriodic, {})).toHaveLength(
      12
    )
    expect(missingAccounts(ACCOUNTING_RULE.accrualUpfront, all)).toEqual([])
  })

  it('never requires the optional accounts or anything for None', () => {
    expect(missingAccounts(ACCOUNTING_RULE.none, {})).toEqual([])
    expect(
      missingAccounts(ACCOUNTING_RULE.cash, all).map(f => f.key)
    ).not.toContain('goodwillCreditAccountId')
  })
})

describe('withoutAccountMappings', () => {
  it('drops the accounts and the accrual setting, and keeps the rest', () => {
    expect(
      withoutAccountMappings({
        name: 'Micro loan',
        accountingRule: 3,
        fundSourceAccountId: 1,
        receivableFeeAccountId: 2,
        enableAccrualActivityPosting: true,
      })
    ).toEqual({ name: 'Micro loan', accountingRule: 3 })
  })
})

describe('helpers', () => {
  it('names the mapping the way GET /loanproducts/{id} returns it', () => {
    expect(mappingKey('fundSourceAccountId')).toBe('fundSourceAccount')
    expect(mappingKey('overpaymentLiabilityAccountId')).toBe(
      'overpaymentLiabilityAccount'
    )
  })

  it('labels accounts as "Name (GL code)"', () => {
    expect(glAccountLabel({ id: 1, name: 'Cash', glCode: '1001' })).toBe(
      'Cash (1001)'
    )
    expect(glAccountLabel({ id: 1, name: 'Cash' })).toBe('Cash')
    expect(glAccountLabel(undefined)).toBe('')
  })

  it('maps rule ids to their labels', () => {
    expect(ruleLabel(2)).toBe('cash')
    expect(ruleLabel(4)).toBe('accrualUpfront')
    expect(ruleLabel(undefined)).toBeUndefined()
  })
})
