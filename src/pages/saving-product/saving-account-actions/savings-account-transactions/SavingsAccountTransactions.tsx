import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SavingsAccountTransactions = () => {
  const { groupId, accountId } = useParams();
  const navigate = useNavigate();

  const [transactionDate, setTransactionDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [note, setNote] = useState("");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // extra details
  const [accountNumber, setAccountNumber] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [bankNumber, setBankNumber] = useState("");

  const backToAccount = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/general`);
    } else {
      navigate(-1);
    }
  };

  const onSubmit = () => {
    console.log("Transaction:", {
      transactionDate,
      amount,
      paymentTypeId,
      note,
      accountNumber,
      checkNumber,
      routingCode,
      receiptNumber,
      bankNumber,
    });
    backToAccount();
  };

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Deposit", current: true },
        ]}
      />

      {/* Form card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">
            Deposit Money To Saving Account
          </h2>

          <div className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label>Transaction Date*</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Transaction Amount*</Label>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-700 text-sm">
                  USD
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>Payment Type*</Label>
              <AppSelect
                selectLabel=""
                selectValue={paymentTypeId}
                selectOnChange={setPaymentTypeId}
                selectPlaceholder="Select payment type"
                selectOptions={[
                  { id: 1, name: "Cash" },
                  { id: 2, name: "Cheque" },
                  { id: 3, name: "Bank Transfer" },
                ]}
                selectClassname="w-full"
              />
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="toggle-details"
                checked={showPaymentDetails}
                onChange={(e) => setShowPaymentDetails(e.target.checked)}
              />
              <Label htmlFor="toggle-details" className={showPaymentDetails ? "text-rose-500" : ""}>
                Show Payment Details
              </Label>
            </div>

            {/* Payment details */}
            {showPaymentDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account #</Label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Cheque #</Label>
                  <Input value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Routing Code</Label>
                  <Input value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} />
                </div>
                <div>
                  <Label>Receipt #</Label>
                  <Input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Bank #</Label>
                  <Input value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} />
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button
              className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={!transactionDate || !amount || !paymentTypeId}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsAccountTransactions;
