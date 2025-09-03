import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type ShareAccount = any;
type ShareTx = any;

const fmtDate = (d: any) => {
  if (!d) return "—";
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d;
    return new Date(y, (m ?? 1) - 1, day ?? 1).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  const dt = new Date(d);
  return isNaN(+dt) ? "—" : dt.toLocaleDateString();
};

const SharesAccountTransactionsTab = () => {
  const { accountId } = useParams();
  const [loading, setLoading] = useState(true);
  const [acct, setAcct] = useState<ShareAccount | null>(null);
  const [rows, setRows] = useState<ShareTx[]>([]);

  // fetch share account 
  useEffect(() => {
    if (!accountId) return;
    (async () => {
      try {
        const res = await fetch(`/api/v1/accounts/share/${accountId}?template=false`);
        const json = await res.json();
        setAcct(json || null);
        const list = Array.isArray(json?.purchasedShares) ? json.purchasedShares : [];
        setRows(list);
      } catch (e) {
        console.error("Failed to load shares transactions", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accountId]);

  // currency formatting
  const currencyCode = acct?.currency?.code ?? "USD";
  const money = (n: number | null | undefined) =>
    n == null
      ? "—"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyCode,
          minimumFractionDigits: 0,
        }).format(Number(n));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">All Transactions</h3>

      <div className="border rounded bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Transaction Type</TableHead>
              <TableHead className="text-right">Total Shares</TableHead>
              <TableHead className="text-right">Purchased/Redeemed Price</TableHead>
              <TableHead className="text-right">Charge Amount</TableHead>
              <TableHead className="text-right">Amount Received/Returned</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading / empty states */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No transactions</TableCell>
              </TableRow>
            ) : (
              // transaction rows
              rows.map((t: ShareTx, idx: number) => {
                const txDate =
                  t?.purchasedDate ??
                  t?.requestedDate ??
                  t?.date ??
                  t?.submittedDate ??
                  null;

                const typeLabel =
                  t?.transactionType?.value ??
                  t?.type?.value ??
                  t?.type ??
                  "—";

                const statusLabel =
                  t?.status?.value ?? t?.status ?? t?.approvalStatus?.value ?? "";

                const totalShares =
                  t?.numberOfShares ?? t?.totalShares ?? t?.shares ?? null;

                const price =
                  t?.purchasedPrice ??
                  t?.purchasePrice ??
                  t?.redeemedPrice ??
                  t?.price ??
                  null;

                const charge = t?.chargeAmount ?? t?.charges ?? 0;
                const amount =
                  t?.amountReceived ??
                  t?.amountReturned ??
                  t?.amount ??
                  null;

                return (
                  <TableRow key={t?.id ?? idx}>
                    <TableCell>{fmtDate(txDate)}</TableCell>
                    <TableCell>
                      {statusLabel ? `${typeLabel} (${statusLabel})` : typeLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalShares == null ? "—" : totalShares}
                    </TableCell>
                    <TableCell className="text-right">{money(price)}</TableCell>
                    <TableCell className="text-right">{money(charge)}</TableCell>
                    <TableCell className="text-right">{money(amount)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SharesAccountTransactionsTab;
