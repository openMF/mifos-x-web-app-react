/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useAppSelector } from '@/app/hook'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import Dropdown from '@/components/custom/navbar/Dropdown'
import AppTabs from '@/components/custom/tabs/AppTabs'

import type {
  GetLoansLoanIdResponse,
  GetLoansLoanIdStatus,
} from '@/fineract-api'
import { LoansApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { faCircle, faMoneyBill } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu } from 'lucide-react'

const loansApi = new LoansApi(getConfiguration())
type Loan = any
type Action = {
  label: string,
  path?: string,
  disabled?: boolean

}
const LoansView = () => {
  const { groupId, loanId } = useParams()
  const [loan, setloan ] = useState<any>()

  /* permissions */
const { user } = useAppSelector((state) => state.auth)
const permissions = user?.permissions || []
const hasAll = permissions.includes('ALL_FUNCTIONS')

useEffect(() => {
  if(!loanId || !groupId) return;
  loansApi.retrieveLoan(Number(loanId) as any)
  .then(res => setloan(res.data))
  .catch(err => console.error('Failed to load loan details', err))
}, [loanId])
 const base = `/groups/${groupId}/loans-accounts/${loanId}`
 const actionsBuild = () =>{
 const actions: Action[] = [];
 if (hasAll || permissions.includes('UPDATE_LOAN')){
  actions.push({ label: 'Modify Application', path: `${base}/actions/Modify`});
 }
 if (hasAll || permissions.includes('APPROVE_LOAN')){
  actions.push({ label: 'Approve Loan', path: `${base}/actions/Approve`});
 }
 if (hasAll || permissions.includes('DISBURSE_LOAN')){
  actions.push({ label: 'Disburse loan', path:`${base}/actions/Disburse`})
 }
 return actions.length? actions : [{ label: 'View Only', disabled: true}]
 }
  const tabs = [
    { label: 'General', href: `${base}/general` },
    { label: 'Transactions', href: `${base}/transactions` },
    { label: 'Notes', href: `${base}/notes` },
  ]

 return (
    <div className="p-6">
      <AppBreadCrumbs items={[{ label: 'Home', href: '/home' }, { label: 'Loans', href: '#' }]} />
      <div className="bg-[#0e77b7] text-white p-6 mt-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-4">
          <FontAwesomeIcon icon={faMoneyBill} className="text-white text-2xl" />
          <div>
            <h2 className="text-xl font-bold">Loan Account: {loan?.accountNo}</h2>
            <p className="text-sm opacity-90">Status: {loan?.status?.value}</p>
          </div>
        </div>
        <Dropdown name={<Menu className="text-white" />} options={actionsBuild()} />
      </div>
      <AppTabs tabs={tabs} />
      <div className="bg-white p-6 border border-t-0 rounded-b-lg shadow-sm"><Outlet /></div>
    </div>
  )
}
export default LoansView
