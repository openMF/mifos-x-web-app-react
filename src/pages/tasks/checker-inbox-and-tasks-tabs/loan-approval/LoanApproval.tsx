import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BatchAPIApi,
  LoansApi, OfficesApi, type GetLoansLoanIdResponse
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const loanApi = new LoansApi(getConfiguration());
const officeApi = new OfficesApi(getConfiguration());


const LoanApproval = () => {
  const batchApi = new BatchAPIApi(getConfiguration());
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [groupedLoans, setGroupedLoans] = useState<
    { officeName: string; loans: GetLoansLoanIdResponse[] }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loanRes, officeRes] = await Promise.all([
          loanApi.retrieveAll27(undefined, undefined, 1000, undefined, undefined, undefined, undefined, undefined, "100"),
          officeApi.retrieveOffices(),
        ]);

        const loans = (loanRes.data.pageItems ?? []) as GetLoansLoanIdResponse[];
        const offices = officeRes.data ?? [];

        const groups: { officeName: string; loans: GetLoansLoanIdResponse[] }[] = [];

        offices.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")).forEach((office) => {
          const loansForOffice = loans.filter(
            (loan) => (loan.clientOfficeId) === office.id
          );
          if (loansForOffice.length > 0) {
            groups.push({ officeName: office.name ?? "Unnamed Office", loans: loansForOffice });
          }
        });

        setGroupedLoans(groups);
      } catch (err) {
        console.error("Error fetching loans:", err);
      }
    };

    fetchData();
  }, []);

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const masterToggle = (loans: GetLoansLoanIdResponse[]) => {
    const loanIds = loans.map((loan) => loan.id!);
    const allSelected = loanIds.every((id) => selectedIds.includes(id));
    setSelectedIds(
      allSelected
        ? selectedIds.filter((id) => !loanIds.includes(id))
        : [...selectedIds, ...loanIds.filter((id) => !selectedIds.includes(id))]
    );
  };

  const approveLoan = async () => {
  if (selectedIds.length === 0) {
    alert("No loans selected for approval.");
    return;
  }

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const batchPayload = selectedIds.map((loanId, index) => ({
    requestId: index + 1,
    method: "POST",
    relativeUrl: `loans/${loanId}?command=approve`,
    body: JSON.stringify({
      approvedOnDate: formattedDate,
      dateFormat: "dd MMMM yyyy",
      locale: "en"
    })
  }));

  try {
    const res = await batchApi.handleBatchRequests(batchPayload, true);
    console.log("Loan approvals successful:", res.data);
    alert("Loans approved successfully.");
    setSelectedIds([]); // Clear selection
  } catch (err) {
    console.error("Loan approval failed:", err);
    alert("Failed to approve loans.");
  }
};


  return (
    <div className="space-y-8">
      {groupedLoans.length > 0 ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Input
              placeholder="Filter by client name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-1/2"
            />
            <Button className="bg-green-600 text-white hover:bg-green-700" onClick={approveLoan}>
              Approve
            </Button>
          </div>

          {groupedLoans.map(({ officeName, loans }) => {
            const filtered = loans.filter((loan) =>
              !filter.trim() || loan.clientName?.toLowerCase().includes(filter.toLowerCase())
            );
            if (filtered.length === 0) return null;

            return (
              <div key={officeName} className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{officeName}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={filtered.every((loan) => selectedIds.includes(loan.id!))}
                          onCheckedChange={() => masterToggle(filtered)}
                        />
                      </TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Loan Product</TableHead>
                      <TableHead>Account No.</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((loan) => (
                      loan.id ? (
                        <TableRow key={loan.id} className="hover:bg-muted/50 cursor-pointer">
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(loan.id)}
                              onCheckedChange={() => toggle(loan.id!)}
                            />
                          </TableCell>
                          <TableCell>{loan.clientName ?? "Unnamed Client"}</TableCell>
                          <TableCell>{loan.loanProductName}</TableCell>
                          <TableCell>{loan.accountNo}</TableCell>
                          <TableCell>{loan.principal?.toLocaleString()}</TableCell>
                          <TableCell>{loan.loanPurposeName ?? "-"}</TableCell>
                        </TableRow>
                      ) : null
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No pending loans for approval.
        </div>
      )}
    </div>
  );
};

export default LoanApproval;
