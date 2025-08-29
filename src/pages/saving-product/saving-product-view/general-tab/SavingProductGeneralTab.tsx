import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { SavingsAccountApi, type SavingsAccountData } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const api = new SavingsAccountApi(getConfiguration());

const SavingProductGeneralTab = () => {
  const { accountId } = useParams();
  const [acct, setAcct] = useState<SavingsAccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    (async () => {
      try {
        const res = await (api as any).retrieveOne25(
          Number(accountId),
          undefined,
          undefined,
          "all"
        );
        setAcct(res.data as SavingsAccountData);
      } catch (e) {
        console.log("Could not load savings account", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [accountId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="loading" />
      </div>
    );
  }
  if (!acct) return null;

  const status: any = (acct as any).status || {};
  const isRejected = !!status.rejected;
  const isPending = !!status.submittedAndPendingApproval;
  const isActive = !!status.active;

  const currency = (acct as any).currency || {};
  const currencyCode = currency.code || "";
  const currencyName = currency.name || "";

  const timeline = (acct as any).timeline || {};
  const activatedOn =
    timeline.activatedOnDate ?? (acct as any).activatedOnDate ?? null;

  const summary = (acct as any).summary || {};
  const subStatus = (acct as any).subStatus || { id: 0 };

  const yesNo = (v?: boolean) => (v ? "Yes" : "No");

  const fmtDate = (d: any) => {
    if (!d) return "Not Activated";
    if (Array.isArray(d)) {
      const dt = new Date(d[0], (d[1] ?? 1) - 1, d[2] ?? 1);
      return dt.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="savings-account-tables flex flex-col gap-6 md:flex-row">
      {/* LEFT COLUMN */}
      <div className="md:w-1/2 flex flex-col gap-6">
        {/* Savings Details (or alternate) */}
        {!isRejected && !isPending ? (
          <div>
            <h4 className="font-semibold mb-2">Savings Details</h4>
            <div className="border rounded bg-white dark:bg-zinc-900">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="bg-zinc-100 w-1/3">External Id</TableCell>
                    <TableCell>
                      {(acct as any).externalId ? (acct as any).externalId : "Not Provided"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="bg-zinc-100">Activated On</TableCell>
                    <TableCell>{fmtDate(activatedOn)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="bg-zinc-100">Field Officer</TableCell>
                    <TableCell>{(acct as any).fieldOfficerName || "Unassigned"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="bg-zinc-100">Currency</TableCell>
                    <TableCell>
                      {currencyName} {currencyCode ? `[${currencyCode}]` : ""}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="bg-zinc-100">Nominal Interest Rate</TableCell>
                    <TableCell className="text-right">
                      {(acct as any).nominalAnnualInterestRate
                        ? `${(acct as any).nominalAnnualInterestRate} %`
                        : "0 %"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold mb-2">Savings Details</h4>
            <div className="border rounded bg-white dark:bg-zinc-900">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="bg-zinc-100 w-1/3">Field Officer</TableCell>
                    <TableCell>{(acct as any).fieldOfficerName || "Unassigned"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="bg-zinc-100">Balance</TableCell>
                    <TableCell className="text-right">{summary.accountBalance}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Performance History */}
        {!isRejected && !isPending && (
          <div>
            <h4 className="font-semibold mb-2">Performance History</h4>
            <div className="border rounded bg-white dark:bg-zinc-900">
              <Table>
                <TableBody>
                  {summary.totalDeposits ? (
                    <TableRow>
                      <TableCell className="bg-zinc-100 w-1/3">Total Deposits</TableCell>
                      <TableCell className="text-right">{summary.totalDeposits}</TableCell>
                    </TableRow>
                  ) : null}
                  {summary.totalInterestEarned >= 0 ? (
                    <TableRow>
                      <TableCell className="bg-zinc-100">Total Interest Earned</TableCell>
                      <TableCell className="text-right">{summary.totalInterestEarned}</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      {isActive ? (
        <div className="md:w-1/2">
          <h4 className="font-semibold mb-2">Account Summary</h4>
          <div className="border rounded bg-white dark:bg-zinc-900">
            <Table>
              <TableBody>
                {summary.totalWithdrawals ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100 w-1/3">Total Withdrawls</TableCell>
                    <TableCell className="text-right">{summary.totalWithdrawals}</TableCell>
                  </TableRow>
                ) : null}
                {summary.totalWithdrawalFees ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Withdrawals Fees</TableCell>
                    <TableCell className="text-right">{summary.totalWithdrawalFees}</TableCell>
                  </TableRow>
                ) : null}
                {summary.totalAnnualFees ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Annual Fees</TableCell>
                    <TableCell className="text-right">{summary.totalAnnualFees}</TableCell>
                  </TableRow>
                ) : null}
                {summary.totalInterestEarned >= 0 ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Interest Earned</TableCell>
                    <TableCell className="text-right">{summary.totalInterestEarned}</TableCell>
                  </TableRow>
                ) : null}
                {summary.totalInterestPosted ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Interest Posted</TableCell>
                    <TableCell className="text-right">{summary.totalInterestPosted}</TableCell>
                  </TableRow>
                ) : null}
                {summary.interestNotPosted >= 0 ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Interest Earned Not Posted</TableCell>
                    <TableCell className="text-right">{summary.interestNotPosted}</TableCell>
                  </TableRow>
                ) : null}
                {(summary as any).totalOverdraftInterestDerived ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Interest On Overdraft</TableCell>
                    <TableCell className="text-right">
                      {(summary as any).totalOverdraftInterestDerived}
                    </TableCell>
                  </TableRow>
                ) : null}
                {summary.interestNotPosted < 0 ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Overdraft Interest Not Posted</TableCell>
                    <TableCell className="text-right">{summary.interestNotPosted}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).nominalAnnualInterestRate ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Nominal Interest Rate</TableCell>
                    <TableCell className="text-right">
                      {(acct as any).nominalAnnualInterestRate} %
                    </TableCell>
                  </TableRow>
                ) : null}
                <TableRow>
                  <TableCell className="bg-zinc-100">Interest Compounding Period</TableCell>
                  <TableCell>{(acct as any).interestCompoundingPeriodType?.value}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-zinc-100">Interest Posting Period</TableCell>
                  <TableCell>{(acct as any).interestPostingPeriodType?.value}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-zinc-100">Interest Calculated Using</TableCell>
                  <TableCell>{(acct as any).interestCalculationType?.value}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-zinc-100">Days in Year</TableCell>
                  <TableCell>{(acct as any).interestCalculationDaysInYearType?.value}</TableCell>
                </TableRow>
                {(acct as any).withdrawalFee?.amount ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Withdrawal Fee</TableCell>
                    <TableCell className="text-right">
                      {(acct as any).withdrawalFee.amount}
                    </TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).lastActiveTransactionDate ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Last Active Transaction Date</TableCell>
                    <TableCell>{fmtDate((acct as any).lastActiveTransactionDate)}</TableCell>
                  </TableRow>
                ) : null}
                {subStatus.id !== 0 ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Substatus</TableCell>
                    <TableCell>{subStatus.value}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).daysToInactive ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Days to Inactive</TableCell>
                    <TableCell>{(acct as any).daysToInactive}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).daysToDormancy ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Days to Dormancy</TableCell>
                    <TableCell>{(acct as any).daysToDormancy}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).daysToEscheat ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Days to Escheat</TableCell>
                    <TableCell>{(acct as any).daysToEscheat}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).annualFee?.amount ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Annual Fee</TableCell>
                    <TableCell className="text-right">
                      {(acct as any).annualFee.amount}
                    </TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).allowOverdraft ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Overdraft Limit</TableCell>
                    <TableCell className="text-right">
                      {(acct as any).overdraftLimit}
                    </TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).allowOverdraft ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">
                      Minimum Overdraft Required for Interest Calculation
                    </TableCell>
                    <TableCell>
                      {(acct as any).minOverdraftForInterestCalculation}
                    </TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).minBalanceForInterestCalculation ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">
                      Min Balance Required for Interest Calculation
                    </TableCell>
                    <TableCell>
                      {(acct as any).minBalanceForInterestCalculation}
                    </TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).minRequiredBalance ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Minimum Required Balance</TableCell>
                    <TableCell>{(acct as any).minRequiredBalance}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).enforceMinRequiredBalance !== undefined ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">
                      Enforce Minimum Required Balance
                    </TableCell>
                    <TableCell>{yesNo((acct as any).enforceMinRequiredBalance)}</TableCell>
                  </TableRow>
                ) : null}
                {summary.lastInterestCalculationDate ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Interest Recalculation Date</TableCell>
                    <TableCell>{fmtDate(summary.lastInterestCalculationDate)}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).onHoldFunds ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">On Hold Funds</TableCell>
                    <TableCell>{(acct as any).onHoldFunds}</TableCell>
                  </TableRow>
                ) : null}
                {(acct as any).withHoldTax ? (
                  <TableRow>
                    <TableCell className="bg-zinc-100">Withhold Tax Group</TableCell>
                    <TableCell>{(acct as any).taxGroup?.name}</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="md:w-1/2">
          <h4 className="font-semibold mb-2">Account Summary</h4>
          <div className="border rounded bg-white dark:bg-zinc-900">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="bg-zinc-100 w-1/3">External Id</TableCell>
                  <TableCell>
                    {(acct as any).externalId ? (acct as any).externalId : "Not Provided"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-zinc-100">Activated On</TableCell>
                  <TableCell>{fmtDate(activatedOn)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-zinc-100">Currency</TableCell>
                  <TableCell>
                    {currencyName} {currencyCode ? `[${currencyCode}]` : ""}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingProductGeneralTab;
