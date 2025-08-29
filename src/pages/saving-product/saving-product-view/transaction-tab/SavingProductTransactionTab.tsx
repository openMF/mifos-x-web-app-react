import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { SavingsAccountApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const api = new SavingsAccountApi(getConfiguration());

const SavingProductTransactionTab = () => {
  const { accountId, transactionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currency, setCurrency] = useState<any>(null);

  useEffect(() => {
    if (!accountId) return;
    (async () => {
      try {
        const res = await (api as any).retrieveOne25(
          Number(accountId),
          undefined,
          undefined,
          "transactions"
        );
        setTransactions(res.data?.transactions || []);
        setCurrency(res.data?.currency || null);
      } catch (e) {
        console.error("Failed to load transactions", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [accountId]);

  const tx = transactionId
    ? transactions.find((t) => String(t.id) === String(transactionId))
    : null;

  if (transactionId && tx) {
    return (
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-4">Transaction Detail</h3>
        <p>
          <b>Id:</b> {tx.id}
        </p>
        <p>
          <b>Transaction Type:</b> {tx.transactionType?.value}
        </p>
        <p>
          <b>Transaction Date:</b> {tx.date}
        </p>
        <p>
          <b>Currency:</b> {currency?.displayLabel || currency?.code}
        </p>
        <p>
          <b>Amount:</b> {tx.amount}
        </p>
        {tx.note && (
          <p>
            <b>Note:</b> {tx.note}
          </p>
        )}
        <Button className="mt-4" onClick={() => navigate("../")}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3 gap-3 items-center">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox />
          <span>Hide Reversed</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox />
          <span>Hide Accruals</span>
        </label>
        <Button className="bg-[#0e77b7] hover:bg-[#0d6aa4]">Export</Button>
      </div>

      <div className="border rounded bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Id</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>External Id</TableHead>
              <TableHead>Transaction Type</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading…</TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No transactions</TableCell>
              </TableRow>
            ) : (
              transactions.map((t, idx) => (
                <TableRow key={t.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.externalId || "—"}</TableCell>
                  <TableCell>{t.transactionType?.value}</TableCell>
                  <TableCell className="text-right">{t.debit || "N/A"}</TableCell>
                  <TableCell className="text-right">{t.credit || "—"}</TableCell>
                  <TableCell className="text-right">{t.runningBalance || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(String(t.id))}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SavingProductTransactionTab;
