import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LoansApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const loansApi = new LoansApi(getConfiguration());

type Loan = any;

function formatCurrency(n: number | null | undefined, code: string) {
  if (n === null || n === undefined) return "Not Provided";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, minimumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}

function formatDate(d: any) {
  if (!d) return "Not Available";
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d;
    return new Date(y, (m ?? 1) - 1, day ?? 1).toLocaleDateString();
  }
  const dt = new Date(d);
  return isNaN(+dt) ? "Not Available" : dt.toLocaleDateString();
}

const Row = ({ label, value, shaded = false }: { label: string; value: string; shaded?: boolean }) => (
  <div className={`grid grid-cols-2 gap-4 px-4 py-3 ${shaded ? "bg-zinc-100 dark:bg-zinc-800/60" : ""}`}>
    <div className="text-zinc-600 dark:text-zinc-300">{label}</div>
    <div className="text-right">{value}</div>
  </div>
);

const LoansGeneralTab = () => {
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

  if (loading) {
    return <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>;
  }

  const currencyCode = loan?.currency?.code ?? "USD";
  const currencyName = loan?.currency?.name ? `${loan.currency.name} ${currencyCode}` : "Not Available";

  const disbursementDate =
    loan?.timeline?.actualDisbursementDate ??
    loan?.timeline?.expectedDisbursementDate ??
    null;

  const loanOfficer =
    loan?.loanOfficerName ??
    loan?.loanOfficer?.displayName ??
    "Unassigned";

  const externalId = loan?.externalId ?? "Not Available";

  // Purpose & amounts
  const loanPurpose =
    loan?.purpose?.name ??
    loan?.loanPurposeName ??
    "Not Provided";

  const proposedAmount =
    loan?.proposedPrincipal ??
    loan?.principal ??
    null;

  const approvedAmount =
    loan?.approvedPrincipal ??
    loan?.approvedPrincipalAmount ??
    null;

  const disbursedAmount =
    loan?.principalDisbursed ??
    loan?.disbursedAmount ??
    null;

  const arrearsBy =
    typeof loan?.summary?.totalOverdue === "number"
      ? loan.summary.totalOverdue
      : null;

  return (
    <div className="space-y-10 text-black dark:text-white">
      {/* Loan Details */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Loan Details</h3>

        <Row label="Disbursement Date" value={formatDate(disbursementDate)} />
        <Row label="Currency" value={currencyName} shaded />
        <Row label="Loan Officer" value={loanOfficer} />
        <Row label="External Id" value={externalId} shaded />
      </section>

      {/* Loan Purpose */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Loan Purpose</h3>

        <Row label="Loan Purpose:" value={loanPurpose} />
        <Row
          label="Proposed Amount:"
          value={formatCurrency(proposedAmount, currencyCode)}
          shaded
        />
        <Row
          label="Approved Amount:"
          value={formatCurrency(approvedAmount, currencyCode)}
        />
        <Row
          label="Disburse Amount:"
          value={formatCurrency(disbursedAmount, currencyCode)}
          shaded
        />
        <Row
          label="Arrears By:"
          value={
            arrearsBy === null ? "Not Provided" : formatCurrency(arrearsBy, currencyCode)
          }
        />
      </section>
    </div>
  );
};

export default LoansGeneralTab;
