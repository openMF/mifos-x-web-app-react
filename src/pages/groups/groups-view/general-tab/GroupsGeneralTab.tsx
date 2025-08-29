import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  GroupsApi,
  RunReportsApi,
  type GetGroupsGroupIdAccountsResponse,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Undo2, ArrowUp, ArrowDown, CheckCircle } from "lucide-react";

const runReportApi = new RunReportsApi(getConfiguration());
const accountApi = new GroupsApi(getConfiguration());

const GroupsGeneralTab = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State for summary data and accounts
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [accounts, setAccounts] = useState<GetGroupsGroupIdAccountsResponse | null>(null);

  // toggles for showing closed accounts
  const [showClosedLoanAccounts, setShowClosedLoanAccounts] = useState(false);
  const [showClosedSavingAccounts, setShowClosedSavingAccounts] = useState(false);

  // fetch group summary + accounts when component mounts / id changes
  useEffect(() => {
    (async () => {
      try {
        const [summaryRes, accountsRes] = await Promise.all([
          runReportApi.runReport("GroupSummaryCounts", false, {
            params: { R_groupId: Number(id), genericResultSet: false },
          }),
          accountApi.retrieveAccounts(Number(id)),
        ]);
        setSummary(summaryRes.data?.data?.[0] ?? {});
        setAccounts(accountsRes.data);
      } catch (e) {
        console.error("Failed to load group details", e);
      }
    })();
  }, [id]);

  // organize accounts from response
  const loanAccounts = Array.from(accounts?.loanAccounts ?? []);
  const gsimAccounts = Array.from(accounts?.memberLoanAccounts ?? []);
  const glimAccounts = Array.from(accounts?.memberLoanAccounts ?? []);
  const savingAccounts = Array.from(accounts?.savingsAccounts ?? []);
  const clientMembers = Array.from(accounts?.memberLoanAccounts ?? []);

  // helper to render status dot based on account status flags
  const statusDot = (acc: any) => (
    <span
      className={`inline-block w-3 h-3 rounded-full ${acc.status?.active
          ? "bg-green-500"
          : acc.status?.submittedAndPendingApproval
            ? "bg-yellow-500"
            : acc.status?.closed || acc.status?.code?.includes("withdrawn")
              ? "bg-zinc-400"
              : "bg-sky-500"
        }`}
      title={acc.status?.value || "Unknown"}
    />
  );

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/*Summary section*/}
      <div>
        <h2 className="text-lg font-semibold">Group Details</h2>
        <div>Active Clients: {summary?.["Active Clients"] ?? 0}</div>
        <div>Active Group Borrowers: {summary?.["Active Group Borrowers"] ?? 0}</div>
        <div>Active Group Loans: {summary?.["Active Group Loans"] ?? 0}</div>
        <div>Active Client Borrowers: {summary?.["Active Client Borrowers"] ?? 0}</div>
        <div>Active Client Loans: {summary?.["Active Client Loans"] ?? 0}</div>
        <div>Active Overdue Client Loans: {summary?.["Active Overdue Client Loans"] ?? 0}</div>
        <div>Active Overdue Group Loans: {summary?.["Active Overdue Group Loans"] ?? 0}</div>
      </div>

      {/*Client Members*/}
      {clientMembers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Client Members</h2>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Account No</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>JLG Loan Application</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientMembers.map((c) => (
                  <TableRow
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}/general`)}
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <TableCell>{c.productName}</TableCell>
                    <TableCell>{c.accountNo}</TableCell>
                    <TableCell>{c.productName}</TableCell>
                    <TableCell>
                      <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
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
          <h2 className="text-lg font-semibold">Loan Accounts</h2>
          {loanAccounts.length > 0 && (
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              size="sm"
              onClick={() => setShowClosedLoanAccounts(!showClosedLoanAccounts)}
            >
              {showClosedLoanAccounts ? "View Active Accounts" : "View Closed Accounts"}
            </Button>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account No</TableHead>
                <TableHead>Loan Account</TableHead>
                <TableHead>Original Loan</TableHead>
                <TableHead>Loan Balance</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Type</TableHead>
                {showClosedLoanAccounts && <TableHead>Closed Date</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loanAccounts
                  .filter((l) =>
                    showClosedLoanAccounts ? l.status?.closed : !l.status?.closed
                  )
                  .filter((l) =>
                    showClosedLoanAccounts
                      ? l.status?.closed || l.status?.code?.includes("withdrawn")
                      : !(l.status?.closed || l.status?.code?.includes("withdrawn"))
                  )
                .map((acc) => (
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
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{acc.loanType?.code}</TableCell>
                    {showClosedLoanAccounts && (
                      <TableCell>{"Missing in OpenAPI"}</TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()} className="space-x-2">
                      {acc.status?.active && (
                        <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
                          <Check className="w-4 h-4 text-white" />
                        </Button>
                      )}
                      {acc.status?.pendingApproval && (
                        <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
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
          <h2 className="text-lg font-semibold mb-2">GSIM Account Overview</h2>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GSIM Id</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gsimAccounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
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
          <h2 className="text-lg font-semibold mb-2">GLIM Loans Account Overview</h2>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GLIM Id</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Original Loan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {glimAccounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
                    <TableCell>{"Missing in OpenAPI"}</TableCell>
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
          <h2 className="text-lg font-semibold">Saving Accounts</h2>
          {savingAccounts.length > 0 && (
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              size="sm"
              onClick={() => setShowClosedSavingAccounts(!showClosedSavingAccounts)}
            >
              {showClosedSavingAccounts ? "View Active Accounts" : "View Closed Accounts"}
            </Button>
          )}
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account No</TableHead>
                <TableHead>Saving Account</TableHead>
                <TableHead>{showClosedSavingAccounts ? "Closed Date" : "Last Active"}</TableHead>
                {!showClosedSavingAccounts && <TableHead>Balance</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savingAccounts
                .filter((s) =>
                  showClosedSavingAccounts ? s.status?.closed : !s.status?.closed
                )
                .map((acc) => (
                  <TableRow
                    key={acc.id}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/groups/${id}/savings-accounts/${acc.id}/transactions`);
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
                        ? acc.accountNo ?? "-"
                        : acc.accountNo ?? "-"}
                    </TableCell>
                    {!showClosedSavingAccounts && (
                      <TableCell>{"Missing in OpenAPI"}</TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()} className="space-x-2">
                      {acc.status?.active && (
                        <>
                          <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
                            <ArrowUp className="w-4 h-4 text-white" />
                          </Button>
                          <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
                            <ArrowDown className="w-4 h-4 text-white" />
                          </Button>
                        </>
                      )}
                      {acc.status?.submittedAndPendingApproval && (
                        <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
                          <Check className="w-4 h-4 text-white" />
                        </Button>
                      )}
                      {!acc.status?.submittedAndPendingApproval && !acc.status?.active && (
                        <>
                          <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
                            <Undo2 className="w-4 h-4 text-white" />
                          </Button>
                          <Button size="icon" className="bg-[#1074b9] hover:bg-[#0662a3]">
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
  );
};

export default GroupsGeneralTab;
