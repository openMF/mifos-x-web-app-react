import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LoansApi } from "@/fineract-api";
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

const loansApi = new LoansApi(getConfiguration());

type Loan = any;
type Txn = any;

const fmtDate = (d: any) => {
  if (!d) return "—";
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d;
    return new Date(y, (m ?? 1) - 1, day ?? 1).toLocaleDateString();
  }
  const dt = new Date(d);
  return isNaN(+dt) ? "—" : dt.toLocaleDateString();
};

const LoansTransactions = () => {
  const { loanId } = useParams();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!loanId) return;
        const res = await loansApi.retrieveLoan(Number(loanId) as any);
        setLoan(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [loanId]);

  if (loading) return <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>;

  const code = loan?.currency?.code ?? "USD";
  const money = (n: number | null | undefined) =>
    n == null
      ? "—"
      : new Intl.NumberFormat(undefined, { style: "currency", currency: code, minimumFractionDigits: 2 }).format(n);

  const txns: Txn[] = Array.isArray(loan?.transactions) ? loan!.transactions : [];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableHeader>
            {/* Grouped header row */}
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Id</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>External Id</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Transaction Type</TableHead>
              <TableHead colSpan={5} className="text-center">
                Breakdown
              </TableHead>
              <TableHead>Loan Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>

            {/* Column labels row */}
            <TableRow className="text-base">
              <TableHead>#</TableHead>
              <TableHead>Id</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>External Id</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Transaction Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Penalties</TableHead>
              <TableHead>Loan Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {txns.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-sm text-zinc-500">
                  No transactions
                </TableCell>
              </TableRow>
            )}

            {txns.map((t, i) => (
              <TableRow key={t.id ?? i} className="text-base">
                <TableCell>{i + 1}</TableCell>
                <TableCell>{t.id ?? "—"}</TableCell>
                <TableCell>{t.officeName ?? loan?.officeName ?? "—"}</TableCell>
                <TableCell>{t.externalId ?? "—"}</TableCell>
                <TableCell>{fmtDate(t.date ?? t.transactionDate)}</TableCell>
                <TableCell>{t.type?.value ?? t.transactionType?.value ?? "—"}</TableCell>

                {/* Breakdown */}
                <TableCell className="text-right">{money(t.amount)}</TableCell>
                <TableCell className="text-right">{money(t.principalPortion ?? t.principalComponent)}</TableCell>
                <TableCell className="text-right">{money(t.interestPortion ?? t.interestComponent)}</TableCell>
                <TableCell className="text-right">{money(t.feeChargesPortion ?? t.feeChargeComponent)}</TableCell>
                <TableCell className="text-right">{money(t.penaltyChargesPortion ?? t.penaltyChargeComponent)}</TableCell>

                {/* Balance & Actions */}
                <TableCell className="text-right">{money(t.outstandingLoanBalance ?? t.balance)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="secondary">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LoansTransactions;
