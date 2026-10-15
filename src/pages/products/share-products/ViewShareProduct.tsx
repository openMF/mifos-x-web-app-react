/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/date-utils'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

import {
  ProductsApi,
  type GetProductsTypeProductIdResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const productsApi = new ProductsApi(getConfiguration())

type EnumOption = { id?: number; code?: string; value?: string }
type GlAccount = { id?: number; name?: string; glCode?: string }

/**
 * GetProductsTypeProductIdResponse types the enums with `description` and the
 * lists as sets, but Fineract sends `value` and JSON arrays (see ISSUES.md)
 */
type ShareProduct = Omit<
  GetProductsTypeProductIdResponse,
  | 'accountingMappings'
  | 'accountingRule'
  | 'charges'
  | 'lockPeriodTypeEnum'
  | 'marketPrice'
  | 'minimumActivePeriodForDividendsTypeEnum'
> & {
  accountingMappings?: {
    shareReferenceId?: GlAccount
    shareSuspenseId?: GlAccount
    shareEquityId?: GlAccount
    incomeFromFeeAccountId?: GlAccount
  }
  accountingRule?: EnumOption
  charges?: {
    id?: number
    name?: string
    amount?: number
    currency?: { displaySymbol?: string }
    chargeCalculationType?: EnumOption
    chargeTimeType?: EnumOption
  }[]
  lockPeriodTypeEnum?: EnumOption
  marketPrice?: {
    id?: number
    fromDate?: number[] | string
    shareValue?: number
  }[]
  minimumActivePeriodForDividendsTypeEnum?: EnumOption
}

const ACCOUNTING_RULE_CASH = 2

const apiErrorMessage = (err: unknown, fallback: string) => {
  const data = (
    err as AxiosError<{
      defaultUserMessage?: string
      errors?: { defaultUserMessage?: string }[]
    }>
  ).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6">
    <h2 className="text-md font-semibold text-blue-600 mb-4">{title}</h2>
    {children}
  </section>
)

const Fields = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-y-3 text-sm">
    {rows.map(([label, value]) => (
      <div key={label} className="contents">
        <dt className="font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </dt>
        <dd className="text-zinc-800 dark:text-zinc-100">{value}</dd>
      </div>
    ))}
  </dl>
)

/** Read-only view of a share product, with the sections of the Angular web app */
const ViewShareProduct = () => {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation(['products', 'common'])
  const navigate = useNavigate()
  const [product, setProduct] = useState<ShareProduct | null>(null)
  const [error, setError] = useState<string | null>(null)

  const productId = Number(id)
  const validId = Number.isInteger(productId) && productId > 0

  useEffect(() => {
    if (!validId) return
    let cancelled = false
    setProduct(null)
    setError(null)
    productsApi
      .retrieveProduct(productId, 'share')
      .then(res => {
        if (!cancelled) setProduct((res.data ?? {}) as ShareProduct)
      })
      .catch(err => {
        if (!cancelled)
          setError(apiErrorMessage(err, t('viewShareProduct.errors.load')))
      })
    return () => {
      cancelled = true
    }
  }, [productId, validId, t])

  const empty = '—'
  const text = (value?: string | null) => value || empty
  const num = (value?: number | null) =>
    value === undefined || value === null
      ? empty
      : new Intl.NumberFormat(i18n.language).format(value)
  const period = (value?: number | null, type?: EnumOption) =>
    value ? `${num(value)} ${type?.value ?? ''}`.trim() : empty
  const glAccount = (account?: GlAccount) =>
    account?.name
      ? `${account.name}${account.glCode ? ` (${account.glCode})` : ''}`
      : empty
  const yesNo = (value?: boolean) =>
    value === undefined
      ? empty
      : value
        ? t('common:actions.yes')
        : t('common:actions.no')

  const accountingRule = product?.accountingRule
  const accountingRuleName =
    accountingRule?.id === 1
      ? t('viewShareProduct.accounting.none')
      : accountingRule?.id === ACCOUNTING_RULE_CASH
        ? t('viewShareProduct.accounting.cashBased')
        : text(accountingRule?.value)
  const mappings = product?.accountingMappings
  const marketPrice = product?.marketPrice ?? []
  const charges = product?.charges ?? []
  const shares = product?.nominalShares

  const pageError = validId ? error : t('viewShareProduct.errors.invalidId')

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/products' },
          { label: t('shareProducts'), href: '/products/share-products' },
          { label: product?.name ?? id ?? '', current: true },
        ]}
      />

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/products/share-products')}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t('common:actions.back')}
        </Button>
      </div>

      {pageError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {pageError}
        </div>
      )}

      {!pageError && !product && (
        <div className="p-10 text-center text-zinc-500">
          {t('common:status.loading')}
        </div>
      )}

      {!pageError && product && (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            {text(product.name)}
          </h1>

          <Section title={t('viewShareProduct.sections.details')}>
            <Fields
              rows={[
                [t('viewShareProduct.fields.name'), text(product.name)],
                [
                  t('viewShareProduct.fields.shortName'),
                  text(product.shortName),
                ],
                [
                  t('viewShareProduct.fields.description'),
                  text(product.description),
                ],
              ]}
            />
          </Section>

          <Section title={t('viewShareProduct.sections.currency')}>
            <Fields
              rows={[
                [
                  t('viewShareProduct.fields.currency'),
                  text(product.currency?.name),
                ],
                [
                  t('viewShareProduct.fields.decimalPlaces'),
                  num(product.currency?.decimalPlaces),
                ],
                [
                  t('viewShareProduct.fields.inMultiplesOf'),
                  num(product.currency?.inMultiplesOf),
                ],
              ]}
            />
          </Section>

          <Section title={t('viewShareProduct.sections.terms')}>
            <Fields
              rows={[
                [
                  t('viewShareProduct.fields.totalShares'),
                  num(product.totalShares),
                ],
                [
                  t('viewShareProduct.fields.sharesIssued'),
                  num(product.totalSharesIssued),
                ],
                [
                  t('viewShareProduct.fields.unitPrice'),
                  num(product.unitPrice),
                ],
                [
                  t('viewShareProduct.fields.capitalValue'),
                  num(product.shareCapital),
                ],
              ]}
            />
          </Section>

          <Section title={t('viewShareProduct.sections.settings')}>
            <Fields
              rows={[
                [
                  t('viewShareProduct.fields.sharesPerClient'),
                  shares === undefined
                    ? empty
                    : t('viewShareProduct.sharesPerClient', {
                        value: num(shares),
                        min: num(product.minimumShares ?? shares),
                        max: num(product.maximumShares ?? shares),
                      }),
                ],
                [
                  t('viewShareProduct.fields.minimumActivePeriod'),
                  period(
                    product.minimumActivePeriod,
                    product.minimumActivePeriodForDividendsTypeEnum
                  ),
                ],
                [
                  t('viewShareProduct.fields.lockinPeriod'),
                  period(product.lockinPeriod, product.lockPeriodTypeEnum),
                ],
                [
                  t('viewShareProduct.fields.allowDividendsForInactive'),
                  yesNo(product.allowDividendCalculationForInactiveClients),
                ],
              ]}
            />
          </Section>

          <Section title={t('viewShareProduct.sections.marketPrice')}>
            {marketPrice.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('viewShareProduct.fields.fromDate')}
                    </TableHead>
                    <TableHead>
                      {t('viewShareProduct.fields.unitPrice')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketPrice.map((price, index) => (
                    <TableRow key={price.id ?? index}>
                      <TableCell>
                        {formatDate(price.fromDate, i18n.language)}
                      </TableCell>
                      <TableCell>{num(price.shareValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-zinc-500">
                {t('viewShareProduct.noMarketPrice')}
              </p>
            )}
          </Section>

          <Section title={t('viewShareProduct.sections.charges')}>
            {charges.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('viewShareProduct.fields.name')}</TableHead>
                    <TableHead>{t('viewShareProduct.fields.type')}</TableHead>
                    <TableHead>{t('viewShareProduct.fields.amount')}</TableHead>
                    <TableHead>
                      {t('viewShareProduct.fields.collectedOn')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge, index) => (
                    <TableRow key={charge.id ?? index}>
                      <TableCell>
                        {text(charge.name)}
                        {charge.currency?.displaySymbol
                          ? `, ${charge.currency.displaySymbol}`
                          : ''}
                      </TableCell>
                      <TableCell>
                        {text(charge.chargeCalculationType?.value)}
                      </TableCell>
                      <TableCell>{num(charge.amount)}</TableCell>
                      <TableCell>
                        {text(charge.chargeTimeType?.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-zinc-500">
                {t('viewShareProduct.noCharges')}
              </p>
            )}
          </Section>

          <Section title={t('viewShareProduct.sections.accounting')}>
            <Fields
              rows={[
                [t('viewShareProduct.fields.type'), accountingRuleName],
                ...(accountingRule?.id === ACCOUNTING_RULE_CASH
                  ? ([
                      [
                        t('viewShareProduct.accounting.shareReference'),
                        glAccount(mappings?.shareReferenceId),
                      ],
                      [
                        t('viewShareProduct.accounting.shareSuspense'),
                        glAccount(mappings?.shareSuspenseId),
                      ],
                      [
                        t('viewShareProduct.accounting.equity'),
                        glAccount(mappings?.shareEquityId),
                      ],
                      [
                        t('viewShareProduct.accounting.incomeFromFees'),
                        glAccount(mappings?.incomeFromFeeAccountId),
                      ],
                    ] as [string, ReactNode][])
                  : []),
              ]}
            />
          </Section>
        </div>
      )}
    </div>
  )
}

export default ViewShareProduct
