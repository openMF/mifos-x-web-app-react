/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  GroupsApi,
  RunReportsApi,
  type GetGroupsGroupIdAccountsResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Check, Undo2, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react'

const runReportApi = new RunReportsApi(getConfiguration())
const accountApi = new GroupsApi(getConfiguration())

const GroupsGeneralTab = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation('groups')
  const { t: tc } = useTranslation('common')

  // State for summary data and accounts
  const [summary, setSummary] = useState<Record<string, any>>({})
  const [accounts, setAccounts] =
    useState<GetGroupsGroupIdAccountsResponse | null>(null)

  // toggles for showing closed accounts
  const [showClosedLoanAccounts, setShowClosedLoanAccounts] = useState(false)
  const [showClosedSavingAccounts, setShowClosedSavingAccounts] =
    useState(false)

  // fetch group summary + accounts when component mounts / id changes
  useEffect(() => {
    ;(async () => {
      try {
        const [summaryRes, accountsRes] = await Promise.all([
          runReportApi.runReport('GroupSummaryCounts', false, {
            params: { R_groupId: Number(id), genericResultSet: false },
          }),
          accountApi.retrieveAccounts(Number(id)),
        ])
        setSummary(summaryRes.data?.data?.[0] ?? {})
        setAccounts(accountsRes.data)
      } catch (e) {
        console.error('Failed to load group details', e)
      }
    })()
  }, [id])

  // organize accounts from response
  const loanAccounts = Array.from(accounts?.loanAccounts ?? [])
  const gsimAccounts = Array.from(accounts?.memberLoanAccounts ?? [])
  const glimAccounts = Array.from(accounts?.memberLoanAccounts ?? [])
  const savingAccounts = Array.from(accounts?.savingsAccounts ?? [])
  const clientMembers = Array.from(accounts?.memberLoanAccounts ?? [])

  // helper to render status dot based on account status flags
  const statusDot = (acc: any) => (
    <span
      className={`inline-block w-3 h-3 rounded-full ${
        acc.status?.active
          ? 'bg-green-500'
          : acc.status?.submittedAndPendingApproval
            ? 'bg-yellow-500'
            : acc.status?.closed || acc.status?.code?.includes('withdrawn')
              ? 'bg-zinc-400'
              : 'bg-sky-500'
      }`}
      title={acc.status?.value || tc('status.unknown')}
    />
  )

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/*Summary section*/}
      <div>
        <h2 className="text-lg font-semibold">{t('general.groupDetails')}</h2>
        <div>{t('general.activeClients')} {summary?.['Active Clients'] ?? 0}</div>
        <div>
          {t('general.activeGroupBorrowers')} {summary?.['Active Group Borrowers'] ?? 0}
        </div>
        <div>{t('general.activeGroupLoans')} {summary?.['Active Group Loans'] ?? 0}</div>
        <div>
          {t('general.activeClientBorrowers')} {summary?.['Active Client Borrowers'] ?? 0}
        </div>
        <div>{t('general.activeClientLoans')} {summary?.['Active Client Loans'] ?? 0}</div>
        <div>
          {t('general.activeOverdueClientLoans')}{' '}
          {summary?.['Active Overdue Client Loans'] ?? 0}
        </div>
        <div>
          {t('general.activeOverdueGroupLoans')}{' '}
          {summary?.['Active Overdue Group Loans'] ?? 0}
        </div>
      </div>

      {/*Client Members*/}
      {clientMembers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">{t('general.clientMembers')}</h2>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('general.tableName')}</TableHead>
                  <TableHead>{t('general.tableAccountNo')}</TableHead>
                  <TableHead>{t('general.tableOffice')}</TableHead>
                  <TableHead>{t('general.tableJlgLoanApplication')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientMembers.map(c => (
                  <TableRow
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}/general`)}
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <TableCell>{c.productName}</TableCell>
                    <TableCell>{c.accountNo}</TableCell>
                    <TableCell>{c.productName}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/*Loan Accounts*/}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">{t('general.loanAccounts')}</h2>
          {loanAccounts.length > 0 && (
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              size="sm"
              onClick={() => setShowClosedLoanAccounts(!showClosedLoanAccounts)}
            >
              {showClosedLoanAccounts
                ? t('general.viewActiveAccounts')
                : t('general.viewClosedAccounts')}
            </Button>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>{t('general.tableAccountNo')}</TableHead>
                  <TableHead>{t('general.tableLoanAccount')}</TableHead>
                  <TableHead>{t('general.tableOriginalLoan')}</TableHead>
                  <TableHead>{t('general.tableLoanBalance')}</TableHead>
                  <TableHead>{t('general.tableAmountPaid')}</TableHead>
                  <TableHead>{t('general.tableType')}</TableHead>
                  {showClosedLoanAccounts && <TableHead>{t('general.tableClosedDate')}</TableHead>}
                  <TableHead>{t('general.tableActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanAccounts
                .filter(l =>
                  showClosedLoanAccounts ? l.status?.closed : !l.status?.closed
                )
                .filter(l =>
                  showClosedLoanAccounts
                    ? l.status?.closed || l.status?.code?.includes('withdrawn')
                    : !(
                        l.status?.closed ||
                        l.status?.code?.includes('withdrawn')
                      )
                )
                .map(acc => (
                  <TableRow
                    key={acc.id}
                    onClick={() =>
                      navigate(`/groups/${id}/loans-accounts/${acc.id}/general`)
                    }
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <TableCell className="flex items-center gap-2">
                      {statusDot(acc)}
                      <span>{acc.accountNo}</span>
                    </TableCell>
                    <TableCell>{acc.productName}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{acc.loanType?.code}</TableCell>
                    {showClosedLoanAccounts && (
                      <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    )}
                    <TableCell
                      onClick={e => e.stopPropagation()}
                      className="space-x-2"
                    >
                      {acc.status?.active && (
                        <Button
                          size="icon"
                          className="bg-[#1074b9] hover:bg-[#0662a3]"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </Button>
                      )}
                      {acc.status?.pendingApproval && (
                        <Button
                          size="icon"
                          className="bg-[#1074b9] hover:bg-[#0662a3]"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/*GSIM Accounts*/}
      {gsimAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">{t('general.gsimAccountOverview')}</h2>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('general.tableGsimId')}</TableHead>
                  <TableHead>{t('general.tableAccountNumber')}</TableHead>
                  <TableHead>{t('general.tableProduct')}</TableHead>
                  <TableHead>{t('general.tableBalance')}</TableHead>
                  <TableHead>{t('general.tableStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gsimAccounts.map(acc => (
                  <TableRow key={acc.id}>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/*GLIM Accounts*/}
      {glimAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            {t('general.glimLoansOverview')}
          </h2>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('general.tableGlimId')}</TableHead>
                  <TableHead>{t('general.tableAccountNumber')}</TableHead>
                  <TableHead>{t('general.tableProduct')}</TableHead>
                  <TableHead>{t('general.tableOriginalLoan')}</TableHead>
                  <TableHead>{t('general.tableStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {glimAccounts.map(acc => (
                  <TableRow key={acc.id}>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/*Saving Accounts*/}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">{t('general.savingAccounts')}</h2>
          {savingAccounts.length > 0 && (
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              size="sm"
              onClick={() =>
                setShowClosedSavingAccounts(!showClosedSavingAccounts)
              }
            >
              {showClosedSavingAccounts
                ? t('general.viewActiveAccounts')
                : t('general.viewClosedAccounts')}
            </Button>
          )}
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>{t('general.tableAccountNo')}</TableHead>
                  <TableHead>{t('general.tableSavingAccount')}</TableHead>
                  <TableHead>
                    {showClosedSavingAccounts ? t('general.tableClosedDate') : t('general.tableLastActive')}
                  </TableHead>
                  {!showClosedSavingAccounts && <TableHead>{t('general.tableBalance')}</TableHead>}
                  <TableHead>{t('general.tableActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savingAccounts
                .filter(s =>
                  showClosedSavingAccounts
                    ? s.status?.closed
                    : !s.status?.closed
                )
                .map(acc => (
                  <TableRow
                    key={acc.id}
                    onClick={e => {
                      e.preventDefault()
                      navigate(
                        `/groups/${id}/savings-accounts/${acc.id}/transactions`
                      )
                    }}
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <TableCell className="flex items-center gap-2">
                      {statusDot(acc)}
                      <span>{acc.accountNo}</span>
                    </TableCell>
                    <TableCell>{acc.productName}</TableCell>
                    <TableCell>
                      {showClosedSavingAccounts
                        ? (acc.accountNo ?? '-')
                        : (acc.accountNo ?? '-')}
                    </TableCell>
                    {!showClosedSavingAccounts && (
                      <TableCell>{t('view.missingInOpenAPI')}</TableCell>
                    )}
                    <TableCell
                      onClick={e => e.stopPropagation()}
                      className="space-x-2"
                    >
                      {acc.status?.active && (
                        <>
                          <Button
                            size="icon"
                            className="bg-[#1074b9] hover:bg-[#0662a3]"
                          >
                            <ArrowUp className="w-4 h-4 text-white" />
                          </Button>
                          <Button
                            size="icon"
                            className="bg-[#1074b9] hover:bg-[#0662a3]"
                          >
                            <ArrowDown className="w-4 h-4 text-white" />
                          </Button>
                        </>
                      )}
                      {acc.status?.submittedAndPendingApproval && (
                        <Button
                          size="icon"
                          className="bg-[#1074b9] hover:bg-[#0662a3]"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </Button>
                      )}
                      {!acc.status?.submittedAndPendingApproval &&
                        !acc.status?.active && (
                          <>
                            <Button
                              size="icon"
                              className="bg-[#1074b9] hover:bg-[#0662a3]"
                            >
                              <Undo2 className="w-4 h-4 text-white" />
                            </Button>
                            <Button
                              size="icon"
                              className="bg-[#1074b9] hover:bg-[#0662a3]"
                            >
                              <CheckCircle className="w-4 h-4 text-white" />
                            </Button>
                          </>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default GroupsGeneralTab
