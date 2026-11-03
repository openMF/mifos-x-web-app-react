/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClientApi, StandingInstructionsApi } from '@/fineract-api'
import { formatDate } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())
const standingInstructionsApi = new StandingInstructionsApi(getConfiguration())

type EnumOption = { id?: number; value?: string }

/**
 * The generated GetPageItemsStandingInstructionSwagger type leaves out most of
 * the fields Fineract returns, so the rows are typed locally.
 */
type StandingInstruction = {
  id: number
  name?: string
  fromAccount?: { id?: number; accountNo?: string }
  fromAccountType?: EnumOption
  toClient?: { id?: number; displayName?: string }
  toAccount?: { id?: number; accountNo?: string }
  toAccountType?: EnumOption
  amount?: number
  /** yyyy-MM-dd, or [y, m, d] depending on the server's date format */
  validFrom?: string | number[]
  /** yyyy-MM-dd, or [y, m, d] depending on the server's date format */
  validTill?: string | number[]
  status?: EnumOption
}

/**
 * Lists the standing instructions that transfer money out of a client's
 * accounts (GET /standinginstructions?clientId=...).
 */
const ClientStandingInstructions = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const clientId = Number(id)

  const [clientName, setClientName] = useState('')
  const [instructions, setInstructions] = useState<StandingInstruction[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    clientApi
      .retrieveOne11(clientId)
      .then(res => {
        if (!cancelled) setClientName(res.data.displayName ?? '')
      })
      .catch(err => console.error('Failed to fetch client', err))
    return () => {
      cancelled = true
    }
  }, [clientId])

  useEffect(() => {
    // Ignore responses that arrive after the user has moved to another client
    let cancelled = false
    const fetchInstructions = async () => {
      setLoading(true)
      setFailed(false)
      if (!clientId) {
        setFailed(true)
        setLoading(false)
        return
      }
      try {
        const res = await standingInstructionsApi.retrieveAll19(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          clientId
        )
        if (cancelled) return
        const pageItems = res.data.pageItems as unknown as StandingInstruction[]
        setInstructions(pageItems ?? [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch standing instructions', err)
        setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchInstructions()
    return () => {
      cancelled = true
    }
  }, [clientId])

  const formatAccount = (
    account?: { accountNo?: string },
    type?: EnumOption
  ) => {
    if (!account?.accountNo) return '—'
    return type?.value
      ? `${account.accountNo} (${type.value})`
      : account.accountNo
  }

  const formatAmount = (amount?: number) =>
    amount == null ? '—' : new Intl.NumberFormat(i18n.language).format(amount)

  // Split the date so it is read in local time; new Date('yyyy-MM-dd') is UTC
  const formatInstructionDate = (value?: string | number[]) =>
    formatDate(
      Array.isArray(value) ? value : value?.split('-').map(Number),
      i18n.language
    )

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          { label: clientName, href: `/clients/${id}/general` },
          { label: t('standingInstructions.title'), current: true },
        ]}
      />

      <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-4">
        <h2 className="text-2xl font-semibold">
          {t('standingInstructions.title')}
        </h2>

        {loading ? (
          <p className="text-sm text-zinc-500">
            {t('standingInstructions.loading')}
          </p>
        ) : failed ? (
          <p className="text-sm text-red-600">
            {t('standingInstructions.failedLoad')}
          </p>
        ) : instructions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {t('standingInstructions.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('standingInstructions.columnName')}</TableHead>
                <TableHead>
                  {t('standingInstructions.columnFromAccount')}
                </TableHead>
                <TableHead>
                  {t('standingInstructions.columnBeneficiary')}
                </TableHead>
                <TableHead>
                  {t('standingInstructions.columnToAccount')}
                </TableHead>
                <TableHead className="text-right">
                  {t('standingInstructions.columnAmount')}
                </TableHead>
                <TableHead>
                  {t('standingInstructions.columnValidity')}
                </TableHead>
                <TableHead>{t('standingInstructions.columnStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructions.map(instruction => (
                <TableRow key={instruction.id}>
                  <TableCell>{instruction.name || '—'}</TableCell>
                  <TableCell>
                    {formatAccount(
                      instruction.fromAccount,
                      instruction.fromAccountType
                    )}
                  </TableCell>
                  <TableCell>
                    {instruction.toClient?.displayName || '—'}
                  </TableCell>
                  <TableCell>
                    {formatAccount(
                      instruction.toAccount,
                      instruction.toAccountType
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(instruction.amount)}
                  </TableCell>
                  <TableCell>
                    {t('standingInstructions.validityRange', {
                      from: formatInstructionDate(instruction.validFrom),
                      till: formatInstructionDate(instruction.validTill),
                    })}
                  </TableCell>
                  <TableCell>{instruction.status?.value || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export default ClientStandingInstructions
