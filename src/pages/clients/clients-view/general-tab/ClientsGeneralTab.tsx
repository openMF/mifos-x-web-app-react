import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import { ClientApi, ClientChargesApi, RunReportsApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

import {
  DollarSign,
  Flag,
  Check,
  Undo2,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
} from "lucide-react";

const accountsApi = new ClientApi(getConfiguration());
const chargesApi = new ClientChargesApi(getConfiguration());
const reportsApi = new RunReportsApi(getConfiguration());

// small dot for status
const StatusDot = ({ acc }: { acc: any }) => {
  const s = acc?.status || {};
  const cls = s.active
    ? "bg-green-500"
    : s.submittedAndPendingApproval || s.pendingApproval
    ? "bg-yellow-500"
    : s.closed
    ? "bg-zinc-400"
    : "bg-sky-500";
  return <span className={`inline-block w-3 h-3 rounded-full ${cls}`} title={s?.value || "Status"} />;
};

const ClientsGeneralTab = () => {
  const navigate = useNavigate();
  const { id: clientId } = useParams();
  const { id } = useParams();

  // data
  const [loanAccounts, setLoanAccounts] = useState<any[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([]);
  const [shareAccounts, setShareAccounts] = useState<any[]>([]);
  const [collaterals, setCollaterals] = useState<any[]>([]);
  const [upcomingCharges, setUpcomingCharges] = useState<any[]>([]);

  // toggles (grey rows are closed)
  const [showClosedLoans, setShowClosedLoans] = useState(false);
  const [showClosedSavings, setShowClosedSavings] = useState(false);
  const [showClosedShares, setShowClosedShares] = useState(false);

  // performance history -> keep the same 5 fields as your Angular template
  const [perf, setPerf] = useState<any>({
    loanCycle: "",
    activeLoans: "",
    lastLoanAmount: "",
    activeSavings: "",
    totalSavings: "",
  });

  useEffect(() => {
    if (!id) return;

    (async () => {
      // accounts
      try {
        const res = await accountsApi.retrieveAssociatedAccounts(Number(id));
        const d: any = res?.data || {};
        setLoanAccounts(Array.isArray(d.loanAccounts) ? d.loanAccounts : []);
        setSavingsAccounts(Array.isArray(d.savingsAccounts) ? d.savingsAccounts : []);
        setShareAccounts(Array.isArray(d.shareAccounts) ? d.shareAccounts : []);
      } catch {
        setLoanAccounts([]);
        setSavingsAccounts([]);
        setShareAccounts([]);
      }

      // charges (keep it simple)
      try {
        const anyApi: any = chargesApi;
        let r: any = null;
        if (typeof anyApi.retrieveAll === "function") r = await anyApi.retrieveAll(Number(id));
        else if (typeof anyApi.retrieveAllClientCharges === "function") r = await anyApi.retrieveAllClientCharges(Number(id));
        const items = Array.isArray(r?.data) ? r.data : r?.data?.pageItems ?? r?.data?.items ?? [];
        setUpcomingCharges(items || []);
      } catch {
        setUpcomingCharges([]);
      }

      // performance history (report values as-is)
      try {
        const r = await reportsApi.runReport("ClientSummaryCounts", false, {
          params: { R_clientId: Number(id), genericResultSet: false },
        });
        const row: any = r?.data?.data?.[0] ?? {};
        setPerf({
          loanCycle: row.loanCycle ?? row["Loan Cycle"] ?? "",
          activeLoans: row.activeLoans ?? row["Active Loans"] ?? "",
          lastLoanAmount: row.lastLoanAmount ?? row["Last Loan Amount"] ?? "",
          activeSavings: row.activeSavings ?? row["Active Savings"] ?? "",
          totalSavings: row.totalSavings ?? row["Total Savings"] ?? "",
        });
      } catch {
        // leave perf values empty if the report isn't there
      }

      // collateral rows (report). we won't re-shape; print what we get.
      try {
        const rr = await reportsApi.runReport("ClientCollateral", false, {
          params: { R_clientId: Number(id), genericResultSet: false },
        });
        const rows: any[] = Array.isArray(rr?.data?.data) ? rr.data.data : [];
        setCollaterals(rows);
      } catch {
        setCollaterals([]);
      }
    })();
  }, [id]);

  // open vs closed 
  const openLoans = loanAccounts.filter((a) => !a?.status?.closed);
  const closedLoans = loanAccounts.filter((a) => a?.status?.closed);
  const openSavings = savingsAccounts.filter((a) => !a?.status?.closed);
  const closedSavings = savingsAccounts.filter((a) => a?.status?.closed);
  const openShares = shareAccounts.filter((a) => !a?.status?.closed);
  const closedShares = shareAccounts.filter((a) => a?.status?.closed);

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Performance History  */}
      <div>
        <h3 className="text-lg font-semibold">Performance History</h3>
        <div className="mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              No. Of Loan Cycles : {perf.loanCycle || "—"} <br />
              No. of Active Loans : {perf.activeLoans || "—"} <br />
              Last Loan Amount : {perf.lastLoanAmount || "—"} <br />
            </div>
            <div>
              No. of Active Savings : {perf.activeSavings || "—"} <br />
              Total Savings : {perf.totalSavings || "—"} <br />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Charges */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upcoming Charges</h2>
        <Button variant="secondary" size="sm" onClick={() => navigate("charges/overview")} disabled>
          Charges Overview
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Due as of</TableHead>
              <TableHead className="px-6 py-4">Due</TableHead>
              <TableHead className="px-6 py-4">Paid</TableHead>
              <TableHead className="px-6 py-4">Waived</TableHead>
              <TableHead className="px-6 py-4">Outstanding</TableHead>
              <TableHead className="px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingCharges.map((ch: any) => (
              <TableRow key={ch?.id} onClick={() => navigate(`/clients/${clientId}/charges/${ch?.id}`)}  className="cursor-pointer">
                <TableCell className="px-6 py-4">{ch?.name ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">
                  {Array.isArray(ch?.dueDate) ? ch.dueDate.toString() : ch?.dueDate ?? "—"}
                </TableCell>
                <TableCell className="px-6 py-4">{ch?.amount ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{ch?.amountPaid ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{ch?.amountWaived ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{ch?.amountOutstanding ?? "—"}</TableCell>
                <TableCell className="px-6 py-4 space-x-2">
                  <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]" onClick={() => navigate(`charges/${ch?.id}/pay`)}>
                    <DollarSign className="w-4 h-4 text-white" />
                  </Button>
                  <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]" onClick={() => navigate(`charges/${ch?.id}/waive`)}>
                    <Flag className="w-4 h-4 text-white" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {upcomingCharges.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-6 text-center text-zinc-500">
                  No upcoming charges.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Loan Accounts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Loan Accounts</h2>
        <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white" size="sm" onClick={() => setShowClosedLoans(!showClosedLoans)}>
          {showClosedLoans ? "View Active Accounts" : "View Closed Accounts"}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account No.</TableHead>
              <TableHead>Loan Product</TableHead>
              <TableHead>Original Loan</TableHead>
              <TableHead>Loan Balance</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Type</TableHead>
              {showClosedLoans && <TableHead>Closed Date</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(showClosedLoans ? closedLoans : openLoans).map((acc: any) => (
              <TableRow
                key={acc?.id}
                onClick={() => navigate(`/clients/${id}/loans-accounts/${acc.id}/general`)}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <TableCell className="px-6 py-4 flex items-center gap-2">
                  <StatusDot acc={acc} />
                  <span>{acc?.accountNo ?? "—"}</span>
                </TableCell>
                <TableCell className="px-6 py-4">{acc?.loanProductName ?? acc?.productName ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{acc?.principal ?? acc?.originalLoan ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{acc?.summary?.totalOutstanding ?? acc?.loanBalance ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{acc?.summary?.totalPaid ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{acc?.loanType?.code ?? "—"}</TableCell>
                {showClosedLoans && (
                  <TableCell className="px-6 py-4">
                    {Array.isArray(acc?.timeline?.closedOnDate)
                      ? acc.timeline.closedOnDate.toString()
                      : acc?.timeline?.closedOnDate ?? "—"}
                  </TableCell>
                )}
                <TableCell className="px-6 py-4 space-x-2" onClick={(e) => e.stopPropagation()}>
                  {acc?.status?.active && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() => navigate(`/clients/${id}/loans-accounts/${acc.id}/actions/Make Repayment`)}
                    >
                      <DollarSign className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {acc?.status?.pendingApproval && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() => navigate(`/clients/${id}/loans-accounts/${acc.id}/actions/Approve`)}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {!acc?.status?.pendingApproval && !acc?.status?.active && !acc?.status?.overpaid && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() => navigate(`/clients/${id}/loans-accounts/${acc.id}/actions/Disburse`)}
                    >
                      <Flag className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {!acc?.status?.pendingApproval && !acc?.status?.active && acc?.status?.overpaid && (
                    <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
                      <ArrowLeftRight className="w-4 h-4 text-white" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(showClosedLoans ? closedLoans : openLoans).length === 0 && (
              <TableRow>
                <TableCell colSpan={showClosedLoans ? 8 : 7} className="px-6 py-6 text-center text-zinc-500">
                  No loan accounts.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Saving Accounts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saving Accounts</h2>
        <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white" size="sm" onClick={() => setShowClosedSavings(!showClosedSavings)}>
          {showClosedSavings ? "View Active Accounts" : "View Closed Accounts"}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account No.</TableHead>
              <TableHead>Savings Product</TableHead>
              <TableHead>{showClosedSavings ? "Closed Date" : "Last Active"}</TableHead>
              {!showClosedSavings && <TableHead>Balance</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(showClosedSavings ? closedSavings : openSavings).map((acc: any) => (
              <TableRow
                key={acc?.id}
                onClick={() => navigate(`/clients/${id}/savings-accounts/${acc.id}/general`)}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <TableCell className="px-6 py-4 flex items-center gap-2">
                  <StatusDot acc={acc} />
                  <span>{acc?.accountNo ?? "—"}</span>
                </TableCell>
                <TableCell className="px-6 py-4">{acc?.productName ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">
                  {showClosedSavings
                    ? Array.isArray(acc?.timeline?.closedOnDate)
                      ? acc.timeline.closedOnDate.toString()
                      : acc?.timeline?.closedOnDate ?? "—"
                    : Array.isArray(acc?.lastActiveTransactionDate)
                    ? acc.lastActiveTransactionDate.toString()
                    : Array.isArray(acc?.timeline?.activatedOnDate)
                    ? acc.timeline.activatedOnDate.toString()
                    : acc?.lastActiveTransactionDate ?? acc?.timeline?.activatedOnDate ?? "—"}
                </TableCell>
                {!showClosedSavings && <TableCell className="px-6 py-4">{acc?.summary?.accountBalance ?? acc?.accountBalance ?? "—"}</TableCell>}
                <TableCell className="px-6 py-4 space-x-2" onClick={(e) => e.stopPropagation()}>
                  {acc?.status?.active && (
                    <>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() => navigate(`/clients/${id}/savings-accounts/${acc.id}/actions/Deposit`)}
                      >
                        <ArrowUp className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() => navigate(`/clients/${id}/savings-accounts/${acc.id}/actions/Withdrawal`)}
                      >
                        <ArrowDown className="w-4 h-4 text-white" />
                      </Button>
                    </>
                  )}
                  {acc?.status?.submittedAndPendingApproval && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() => navigate(`/clients/${id}/savings-accounts/${acc.id}/actions/Approve`)}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {!acc?.status?.submittedAndPendingApproval && !acc?.status?.active && (
                    <>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() => navigate(`/clients/${id}/savings-accounts/${acc.id}/actions/Undo Approval`)}
                      >
                        <Undo2 className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() => navigate(`/clients/${id}/savings-accounts/${acc.id}/actions/Activate`)}
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(showClosedSavings ? closedSavings : openSavings).length === 0 && (
              <TableRow>
                <TableCell colSpan={showClosedSavings ? 5 : 6} className="px-6 py-6 text-center text-zinc-500">
                  No savings accounts.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Shares Accounts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Shares Accounts</h2>
        {shareAccounts.length > 0 && (
          <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white" size="sm" onClick={() => setShowClosedShares(!showClosedShares)}>
            {showClosedShares ? "View Active Accounts" : "View Closed Accounts"}
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account No.</TableHead>
              <TableHead>Share Product</TableHead>
              <TableHead>Approved Shares</TableHead>
              <TableHead>Pending For Approval Shares</TableHead>
              {showClosedShares && <TableHead>Closed Date</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(showClosedShares ? closedShares : openShares).map((acc: any) => (
              <TableRow
                key={acc?.id}
                onClick={() => navigate(`/clients/${id}/shares-accounts/${acc.id}/general`)}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <TableCell className="px-6 py-4 flex items-center gap-2">
                  <StatusDot acc={acc} />
                  <span>{acc?.accountNo ?? "—"}</span>
                </TableCell>
                <TableCell className="px-6 py-4">{acc?.productName ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{acc?.totalApprovedShares ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{acc?.totalPendingForApprovalShares ?? "—"}</TableCell>
                {showClosedShares && (
                  <TableCell className="px-6 py-4">
                    {Array.isArray(acc?.timeline?.closedOnDate)
                      ? acc.timeline.closedOnDate.toString()
                      : acc?.timeline?.closedOnDate ?? "—"}
                  </TableCell>
                )}
                <TableCell className="px-6 py-4 space-x-2" onClick={(e) => e.stopPropagation()}>
                  {acc?.status?.submittedAndPendingApproval && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() => navigate(`/clients/${id}/shares-accounts/${acc.id}/actions/Approve`)}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {!acc?.status?.submittedAndPendingApproval && !acc?.status?.active && (
                    <>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() => navigate(`/clients/${id}/shares-accounts/${acc.id}/actions/Undo Approval`)}
                      >
                        <Undo2 className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() => navigate(`/clients/${id}/shares-accounts/${acc.id}/actions/Activate`)}
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(showClosedShares ? closedShares : openShares).length === 0 && (
              <TableRow>
                <TableCell colSpan={showClosedShares ? 6 : 5} className="px-6 py-6 text-center text-zinc-500">
                  No share accounts.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Collateral Data */}
      <div>
        <h2 className="text-lg font-semibold">Collateral Data</h2>
        <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Total Collateral Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaterals.map((c: any, i: number) => {
                const qty = c?.quantity ?? 0;
                const base = c?.basePrice ?? 0;
                const pct = c?.pctToBase ?? 0;
                const total = base * qty;
                const totalCollateral = (pct * base * qty) / 100;
                return (
                  <TableRow key={c?.collateralId ?? c?.id ?? i}>
                    <TableCell>{c?.collateralId ?? c?.id ?? "—"}</TableCell>
                    <TableCell>{c?.name ?? c?.collateralName ?? "—"}</TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell>{total}</TableCell>
                    <TableCell>{totalCollateral}</TableCell>
                  </TableRow>
                );
              })}
              {collaterals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-6 text-center text-zinc-500">
                    No collateral found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ClientsGeneralTab;
