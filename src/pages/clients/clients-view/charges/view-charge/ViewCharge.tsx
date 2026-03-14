/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDollarSign,
  faFlag,
  faTrash,
  faStop,
} from '@fortawesome/free-solid-svg-icons'
import {
  ClientChargesApi,
  type GetClientsChargesPageItems,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import { useTranslation } from 'react-i18next'

const chargeApi = new ClientChargesApi(getConfiguration())
const ViewCharge = () => {
  const navigate = useNavigate()
  const { clientId, chargeId } = useParams<{
    clientId: string
    chargeId: string
  }>()

  const [charge, setCharge] = useState<GetClientsChargesPageItems>()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  useEffect(() => {
    if (!clientId || !chargeId) return
    const fetchDetails = async () => {
      try {
        const res = await chargeApi.retrieveClientCharge(
          Number(clientId),
          Number(chargeId)
        )
        setCharge(res.data)
      } catch (err) {
        console.log("Couldn't fetch charge details", err)
      }
    }
    fetchDetails()
  }, [clientId, chargeId])

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          { label: t('client'), href: `/clients/${clientId}/general` },
          { label: charge?.name || t('charge.breadcrumbLabel'), current: true },
        ]}
      />

      {/* top actions */}
      <div className="flex  gap-3 mb-4">
        <Button
          onClick={() => navigate('pay')}
          className="bg-[#1074b9] text-white"
        >
          <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
          {t('charge.buttonPay')}
        </Button>
        <Button onClick={() => {}} className="bg-[#1074b9] text-white">
          <FontAwesomeIcon icon={faFlag} className="mr-2" />
          {t('charge.buttonWaive')}
        </Button>
        <Button onClick={() => {}} className="bg-[#1074b9] text-white">
          <FontAwesomeIcon icon={faTrash} className="mr-2" />
          {t('charge.buttonDelete')}
        </Button>
      </div>

      {/* charge details */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <div className="px-6 py-4 text-lg font-semibold flex items-center gap-2">
          <FontAwesomeIcon
            icon={faStop}
            className={
              charge?.isWaived || charge?.isPaid
                ? 'text-zinc-400'
                : 'text-green-600'
            }
          />
          {charge?.name}
        </div>

        <div className="border-t px-6 py-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-1/3 p-3">{t('charge.labelCurrency')}</td>
                <td className="p-3">{charge?.currency?.name}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelChargeTimeType')}</td>
                <td className="p-3">{charge?.chargeTimeType?.code}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelChargeCalculationType')}</td>
                <td className="p-3">{charge?.chargeCalculationType?.code}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelDueAsOf')}</td>
                <td className="p-3">{formatDate(charge?.dueDate as number[] | undefined)}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelDue')}</td>
                <td className="p-3">{charge?.amount}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelPaid')}</td>
                <td className="p-3">{charge?.amountPaid}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelWaived')}</td>
                <td className="p-3">{charge?.amountWaived}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelOutstanding')}</td>
                <td className="p-3">{charge?.amountOutstanding}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* transactions */}
        {/* <div className="px-6 py-4">
          <h1 className="text-xl font-bold mb-3">Transactions</h1>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Office Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Transaction Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charge?.clientTransactionDatas?.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className={strike(tx.reversed)}>{tx.id}</TableCell>
                  <TableCell className={strike(tx.reversed)}>{tx.officeName}</TableCell>
                  <TableCell className={strike(tx.reversed)}>{tx.type?.value}</TableCell>
                  <TableCell className={strike(tx.reversed)}>{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell className={strike(tx.reversed)}>{tx.amount}</TableCell>
                  <TableCell>
                    <Button className="bg-red-600 text-white">
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6">
            <Button type="button" variant="outline" onClick={() => navigate("../../general")}>
              Back
            </Button>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default ViewCharge
