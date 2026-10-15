/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

/** Entities a data table can be attached to, as in the Angular web app */
export const APP_TABLES = [
  { id: 'm_client', key: 'client' },
  { id: 'm_group', key: 'group' },
  { id: 'm_center', key: 'center' },
  { id: 'm_office', key: 'office' },
  { id: 'm_loan', key: 'loanAccount' },
  { id: 'm_wc_loan', key: 'workingCapitalLoanAccount' },
  { id: 'm_savings_account', key: 'savingAccount' },
  { id: 'm_product_loan', key: 'loanProduct' },
  { id: 'm_wc_loan_product', key: 'workingCapitalLoanProduct' },
  { id: 'm_savings_account_transaction', key: 'savingAccountTransaction' },
  { id: 'm_savings_product', key: 'savingsProduct' },
  { id: 'm_share_product', key: 'shareProduct' },
] as const

export const ENTITY_SUB_TYPES = [
  { id: 'Person', key: 'person' },
  { id: 'Entity', key: 'entity' },
] as const

export const SAVINGS_SUB_TYPES = [
  { id: 'Savings Product', key: 'savingsProduct' },
  { id: 'Fixed Deposit', key: 'fixedDeposit' },
  { id: 'Recurring Deposit', key: 'recurringDeposit' },
] as const

/** Column types; the id is what Fineract takes, the key names the label */
export const COLUMN_TYPES = [
  { id: 'Boolean', key: 'boolean' },
  { id: 'Date', key: 'date' },
  { id: 'Datetime', key: 'datetime' },
  { id: 'Decimal', key: 'decimal' },
  { id: 'Dropdown', key: 'dropdown' },
  { id: 'json', key: 'json' },
  { id: 'Number', key: 'number' },
  { id: 'String', key: 'string' },
  { id: 'Text', key: 'text' },
] as const

/** The option lists above with their labels in the current language */
export const useDataTableOptions = () => {
  const { t } = useTranslation('datatables')
  return {
    appTables: APP_TABLES.map(o => ({
      id: o.id,
      name: t(`manage.appTables.${o.key}`),
    })),
    entitySubTypes: ENTITY_SUB_TYPES.map(o => ({
      id: o.id,
      name: t(`manage.subTypes.${o.key}`),
    })),
    savingsSubTypes: SAVINGS_SUB_TYPES.map(o => ({
      id: o.id,
      name: t(`manage.subTypes.${o.key}`),
    })),
    columnTypes: COLUMN_TYPES.map(o => ({
      id: o.id,
      name: t(`columnTypes.${o.key}`),
    })),
    /** The label of a column type id, or the id itself if it is unknown */
    typeName: (type: string) => {
      const key = COLUMN_TYPES.find(o => o.id === type)?.key
      return key ? t(`columnTypes.${key}`) : type
    },
  }
}

/** The column linking each row to its entity, as in the Angular web app */
export const RELATIONSHIP_COLUMNS: Record<string, string> = {
  m_client: 'client_id',
  m_group: 'group_id',
  m_center: 'center_id',
  m_office: 'office_id',
  m_loan: 'loan_id',
  m_wc_loan: 'wc_loan_id',
  m_savings_account: 'savings_account_id',
  m_savings_account_transaction: 'savings_transaction_id',
  m_product_loan: 'product_loan_id',
  m_wc_loan_product: 'wc_product_loan_id',
  m_savings_product: 'savings_product_id',
  m_share_product: 'share_product_id',
}

/** Columns Fineract manages itself, which cannot be edited or dropped */
export const isSystemColumn = (columnName: string, apptableName: string) =>
  ['id', 'created_at', 'updated_at'].includes(columnName) ||
  columnName === RELATIONSHIP_COLUMNS[apptableName]

export type DataTablesApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}
