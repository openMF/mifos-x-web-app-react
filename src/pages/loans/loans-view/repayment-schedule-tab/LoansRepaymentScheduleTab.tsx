import { useEffect, useMemo, useState } from "react";
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
type Period = any;

const fmtDate = (d: any) => {
  if (!d) return "—";
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d;
    return new Date(y, (m ?? 1) - 1, day ?? 1).toLocaleDateString();
  }
  const dt = new Date(d);
  return isNaN(+dt) ? "—" : dt.toLocaleDateString();
};

const LoansRepaymentScheduleTab = () => {
  const { loanId } = useParams();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  // fetch loan details
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

  // currency formatter
  const currencyCode = loan?.currency?.code ?? "USD";
  const currency = (n: number | null | undefined) =>
    n == null
      ? "—"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyCode,
          minimumFractionDigits: 2,
        }).format(n);

  // repayment schedule
  const schedule = loan?.repaymentSchedule ?? {};
  const rawPeriods: Period[] = Array.isArray(schedule?.periods) ? schedule.periods : [];

  // filter out disbursement 
  const periods = useMemo(
    () => rawPeriods.filter((p) => (p?.period ?? 0) > 0),
    [rawPeriods]
  );

  // disbursement row
  const disbursement = rawPeriods.find((p) => (p?.period ?? 0) === 0);
  const disbDate =
    loan?.timeline?.actualDisbursementDate ??
    loan?.timeline?.expectedDisbursementDate ??
    disbursement?.dueDate;
  const openingBalance =
    disbursement?.principalLoanBalanceOutstanding ??
    schedule?.principalDisbursed ??
    loan?.principal ??
    null;

  // totals
  const totals = periods.reduce(
    (acc, p) => {
      const principal = p?.principalDue ?? 0;
      const interest = p?.interestDue ?? 0;
      const fees = p?.feeChargesDue ?? 0;
      const penalties = p?.penaltyChargesDue ?? 0;
      const due =
        p?.totalDueForPeriod ?? principal + interest + fees + penalties;

      const paid = p?.totalPaidForPeriod ?? 0;
      const inAdvance = p?.totalPaidInAdvanceForPeriod ?? 0;
      const late = p?.totalPaidLateForPeriod ?? 0;
      const outstanding =
        p?.totalOutstandingForPeriod ?? Math.max(due - paid, 0);

      acc.principal += principal;
      acc.interest += interest;
      acc.fees += fees;
      acc.penalties += penalties;
      acc.due += due;
      acc.paid += paid;
      acc.inAdvance += inAdvance;
      acc.late += late;
      acc.outstanding += outstanding;
      return acc;
    },
    {
      principal: schedule?.totalPrincipalExpected ?? 0,
      interest: schedule?.totalInterestExpected ?? schedule?.totalInterestCharged ?? 0,
      fees: schedule?.totalFeeChargesExpected ?? schedule?.totalFeeChargesCharged ?? 0,
      penalties: schedule?.totalPenaltyChargesExpected ?? schedule?.totalPenaltyChargesCharged ?? 0,
      due: schedule?.totalRepaymentExpected ?? 0,
      paid: schedule?.totalPaid ?? 0,
      inAdvance: schedule?.totalPaidInAdvance ?? 0,
      late: schedule?.totalPaidLate ?? 0,
      outstanding: schedule?.totalOutstanding ?? 0,
    }
  );

  if (loading) return <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>;

  return (
    <div className="space-y-4">
      {/* export button */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => window.print()}>
          Export to PDF
        </Button>
      </div>

      {/* schedule table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableHeader>
            {/* grouped header */}
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead colSpan={2} className="text-center">
                Loan Amount and Balance
              </TableHead>
              <TableHead colSpan={3} className="text-center">
                Total Cost of Loan
              </TableHead>
              <TableHead colSpan={5} className="text-center">
                Installment Totals
              </TableHead>
            </TableRow>

            {/* labels row */}
            <TableRow className="text-base">
              <TableHead>#</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead>Balance Of Loan</TableHead>
              <TableHead>Principal Due</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Penalties</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>In advance</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Outstanding</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* disbursement row */}
            {disbDate && (
              <TableRow>
                <TableCell />
                <TableCell />
                <TableCell className="font-medium">{fmtDate(disbDate)}</TableCell>
                <TableCell />
                <TableCell className="font-medium">{currency(openingBalance)}</TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell className="font-medium">{currency(openingBalance)}</TableCell>
              </TableRow>
            )}

            {/* installment rows */}
            {periods.map((p: Period) => {
              const principal = p?.principalDue ?? 0;
              const interest = p?.interestDue ?? 0;
              const fees = p?.feeChargesDue ?? 0;
              const penalties = p?.penaltyChargesDue ?? 0;
              const due = p?.totalDueForPeriod ?? principal + interest + fees + penalties;
              const paid = p?.totalPaidForPeriod ?? 0;
              const inAdvance = p?.totalPaidInAdvanceForPeriod ?? 0;
              const late = p?.totalPaidLateForPeriod ?? 0;
              const outstanding = p?.totalOutstandingForPeriod ?? Math.max(due - paid, 0);

              return (
                <TableRow key={p?.period ?? fmtDate(p?.dueDate)} className="text-base">
                  <TableCell>{p?.period ?? "—"}</TableCell>
                  <TableCell className="text-red-500">{p?.daysInPeriod ?? p?.days ?? "—"}</TableCell>
                  <TableCell className="text-red-500">{fmtDate(p?.dueDate)}</TableCell>
                  <TableCell>{p?.obligationsMetOnDate ? fmtDate(p.obligationsMetOnDate) : "—"}</TableCell>
                  <TableCell className="text-right">{currency(p?.principalLoanBalanceOutstanding)}</TableCell>
                  <TableCell className="text-right text-red-500">{currency(principal)}</TableCell>
                  <TableCell className="text-right text-red-500">{currency(interest)}</TableCell>
                  <TableCell className="text-right">{currency(fees)}</TableCell>
                  <TableCell className="text-right">{currency(penalties)}</TableCell>
                  <TableCell className="text-right text-red-500">{currency(due)}</TableCell>
                  <TableCell className="text-right">{currency(paid)}</TableCell>
                  <TableCell className="text-right">{currency(inAdvance)}</TableCell>
                  <TableCell className="text-right">{currency(late)}</TableCell>
                  <TableCell className="text-right font-medium">{currency(outstanding)}</TableCell>
                </TableRow>
              );
            })}

            {/* totals row */}
            <TableRow>
              <TableCell colSpan={5} className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.principal)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.interest)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.fees)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.penalties)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.due)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.paid)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.inAdvance)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.late)}</TableCell>
              <TableCell className="text-right font-semibold">{currency(totals.outstanding)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LoansRepaymentScheduleTab;
