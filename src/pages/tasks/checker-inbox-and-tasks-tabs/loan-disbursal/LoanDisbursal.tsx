import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  LoansApi,
  BatchAPIApi,
  type GetLoansLoanIdResponse
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const LoanDisbursal = () => {
  const loanApi = new LoansApi(getConfiguration());
  const batchApi = new BatchAPIApi(getConfiguration());

  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [groupedLoans, setGroupedLoans] = useState<Record<string, GetLoansLoanIdResponse[]>>({});
  const [hasLoans, setHasLoans] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await loanApi.retrieveAll27(
          undefined,
          undefined,
          1000,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "200" // status = Approved loans
        );

        const pageItems = (res.data.pageItems ?? []) as GetLoansLoanIdResponse[];

        const grouped = pageItems.reduce((acc: Record<string, GetLoansLoanIdResponse[]>, loan) => {
          const group = "Unassigned"; // fallback grouping
          if (!acc[group]) acc[group] = [];
          acc[group].push(loan);
          return acc;
        }, {});

        setGroupedLoans(grouped);
        setHasLoans(pageItems.length > 0);
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

  const disburseLoan = async () => {
    if (selectedIds.length === 0) {
      alert("No loans selected for disbursal.");
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
      relativeUrl: `loans/${loanId}?command=disburse`,
      body: JSON.stringify({
        actualDisbursementDate: formattedDate,
        dateFormat: "dd MMMM yyyy",
        locale: "en"
      })
    }));

    try {
      const res = await batchApi.handleBatchRequests(batchPayload, true);
      console.log("Loan disbursal successful:", res.data);
      alert("Selected loans disbursed successfully.");
      setSelectedIds([]);
    } catch (err) {
      console.error("Loan disbursal failed:", err);
      alert("Failed to disburse loans.");
    }
  };

  return (
    <div className="space-y-8">
      {hasLoans ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Input
              placeholder="Filter by client name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-1/2"
            />
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={disburseLoan}
            >
              Disburse
            </Button>
          </div>

          {Object.keys(groupedLoans).map((group) => {
            const loans = groupedLoans[group].filter((loan) =>
              loan.clientName?.toLowerCase().includes(filter.toLowerCase())
            );

            return (
              <div key={group} className="space-y-4">
                {loans.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Checkbox
                            checked={loans.every((loan) => selectedIds.includes(loan.id!))}
                            onCheckedChange={() => masterToggle(loans)}
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
                      {loans.map((loan) =>
                        loan.id ? (
                          <TableRow key={loan.id} className="hover:bg-muted/50 cursor-pointer">
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(loan.id)}
                                onCheckedChange={() => toggle(loan.id!)}
                              />
                            </TableCell>
                            <TableCell>{loan.clientName}</TableCell>
                            <TableCell>{loan.loanProductName}</TableCell>
                            <TableCell>{loan.accountNo}</TableCell>
                            <TableCell>{loan.principal?.toLocaleString()}</TableCell>
                            <TableCell>{loan.loanPurposeName ?? "-"}</TableCell>
                          </TableRow>
                        ) : null
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No approved loans available for disbursal.
        </div>
      )}
    </div>
  );
};

export default LoanDisbursal;
