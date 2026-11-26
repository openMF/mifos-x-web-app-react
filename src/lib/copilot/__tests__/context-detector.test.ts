/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import { detectContextFromPath } from '../context-detector'

describe('detectContextFromPath', () => {
  it('detects home and dashboard paths', () => {
    expect(detectContextFromPath('/')).toEqual({ screen: 'home' })
    expect(detectContextFromPath('/home')).toEqual({ screen: 'home' })
    expect(detectContextFromPath('/dashboard')).toEqual({ screen: 'home' })
  })

  it('detects client list and client create screens', () => {
    expect(detectContextFromPath('/clients')).toEqual({ screen: 'client-list' })
    expect(detectContextFromPath('/clients/create')).toEqual({
      screen: 'client-create',
    })
  })

  it('detects client detail screen and extracts clientId', () => {
    expect(detectContextFromPath('/clients/12')).toEqual({
      screen: 'client-detail',
      clientId: 12,
    })
    expect(detectContextFromPath('/clients/12/general')).toEqual({
      screen: 'client-detail',
      clientId: 12,
    })
    expect(detectContextFromPath('/clients/12/notes')).toEqual({
      screen: 'client-detail',
      clientId: 12,
    })
    expect(detectContextFromPath('/clients/12/actions/close')).toEqual({
      screen: 'client-detail',
      clientId: 12,
    })
  })

  it('detects client loan account and extracts both clientId and loanId', () => {
    expect(detectContextFromPath('/clients/12/loans-accounts/45')).toEqual({
      screen: 'loan-detail',
      clientId: 12,
      loanId: 45,
    })
    expect(
      detectContextFromPath('/clients/12/loans-accounts/45/general')
    ).toEqual({
      screen: 'loan-detail',
      clientId: 12,
      loanId: 45,
    })
    expect(
      detectContextFromPath('/clients/12/loans-accounts/45/actions/Foreclosure')
    ).toEqual({
      screen: 'loan-detail',
      clientId: 12,
      loanId: 45,
    })
  })

  it('detects group loan account and extracts loanId', () => {
    expect(detectContextFromPath('/groups/5/loans-accounts/45')).toEqual({
      screen: 'loan-detail',
      loanId: 45,
    })
    expect(
      detectContextFromPath('/groups/5/loans-accounts/45/repayment-schedule')
    ).toEqual({
      screen: 'loan-detail',
      loanId: 45,
    })
  })

  it('detects direct loan routes and loan list', () => {
    expect(detectContextFromPath('/loans')).toEqual({ screen: 'loan-list' })
    expect(detectContextFromPath('/loans/45')).toEqual({
      screen: 'loan-detail',
      loanId: 45,
    })
    expect(detectContextFromPath('/loans/view/45')).toEqual({
      screen: 'loan-detail',
      loanId: 45,
    })
  })

  it('detects client savings accounts and extracts clientId and savingsId', () => {
    expect(detectContextFromPath('/clients/12/savings-accounts/88')).toEqual({
      screen: 'savings-detail',
      clientId: 12,
      savingsId: 88,
    })
    expect(
      detectContextFromPath('/clients/12/savings-accounts/88/transactions')
    ).toEqual({
      screen: 'savings-detail',
      clientId: 12,
      savingsId: 88,
    })
    expect(
      detectContextFromPath('/clients/12/fixed-deposits-accounts/99')
    ).toEqual({
      screen: 'savings-detail',
      clientId: 12,
      savingsId: 99,
    })
  })

  it('detects group savings accounts, direct savings, and savings list', () => {
    expect(detectContextFromPath('/savings')).toEqual({
      screen: 'savings-list',
    })
    expect(detectContextFromPath('/groups/5/savings-accounts/88')).toEqual({
      screen: 'savings-detail',
      savingsId: 88,
    })
    expect(detectContextFromPath('/savings/88')).toEqual({
      screen: 'savings-detail',
      savingsId: 88,
    })
  })

  it('detects accounting and journal entry screens', () => {
    expect(detectContextFromPath('/accounting/create-journal-entry')).toEqual({
      screen: 'journal-entry',
    })
    expect(detectContextFromPath('/accounting/journal-entries')).toEqual({
      screen: 'journal-entry',
    })
    expect(detectContextFromPath('/accounting/chart-of-accounts')).toEqual({
      screen: 'accounting',
    })
    expect(detectContextFromPath('/accounting/closing-entries')).toEqual({
      screen: 'accounting',
    })
  })

  it('detects groups, reports, users and settings', () => {
    expect(detectContextFromPath('/groups')).toEqual({ screen: 'group-list' })
    expect(detectContextFromPath('/groups/create')).toEqual({
      screen: 'group-create',
    })
    expect(detectContextFromPath('/groups/7')).toEqual({
      screen: 'group-detail',
    })
    expect(detectContextFromPath('/reports')).toEqual({ screen: 'reports' })
    expect(detectContextFromPath('/users')).toEqual({ screen: 'users' })
    expect(detectContextFromPath('/settings')).toEqual({ screen: 'settings' })
  })

  it('handles query parameters and trailing slashes cleanly', () => {
    expect(
      detectContextFromPath('/clients/12/general?filter=active#section')
    ).toEqual({
      screen: 'client-detail',
      clientId: 12,
    })
    expect(detectContextFromPath('/clients/12/')).toEqual({
      screen: 'client-detail',
      clientId: 12,
    })
  })
})
