import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { LoansApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const loansApi = new LoansApi(getConfiguration());

// tiny date helpers
const toInputDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const toFineractDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${String(d).padStart(2, "0")} ${months[(m || 1) - 1]} ${y}`;
};

type PaymentType = { id: number; name: string };

const MakeRepayment = () => {
  const navigate = useNavigate();
  const { groupId, loanId } = useParams();

  // simple form state
  const [transactionDate, setTransactionDate] = useState(toInputDate());
  const [amount, setAmount] = useState("");
  const [externalId, setExternalId] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [note, setNote] = useState("");

  // optional payment details
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [bankNumber, setBankNumber] = useState("");

  // template bits
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [principal, setPrincipal] = useState(0);
  const [interest, setInterest] = useState(0);
  const [fees, setFees] = useState(0);
  const [penalties, setPenalties] = useState(0);

  const [saving, setSaving] = useState(false);

  // load repayment template 
  const loadTemplate = async (isoDate: string) => {
    if (!loanId) return;
    try {
      const api: any = loansApi as any;
      const res = await api.retrieveLoanTransactionTemplate(
        Number(loanId),
        "repayment",
        { params: { dateFormat: "dd MMMM yyyy", locale: "en", transactionDate: toFineractDate(isoDate) } }
      );
      const t = res?.data || {};
      setCurrencyCode(t?.currency?.code || t?.currencyCode || "USD");
      setPaymentTypes((t?.paymentTypeOptions || []).map((p: any) => ({ id: p.id, name: p.name })));
      setPrincipal(Number(t?.principalPortion || 0));
      setInterest(Number(t?.interestPortion || 0));
      setFees(Number(t?.feeChargesPortion || 0));
      setPenalties(Number(t?.penaltyChargesPortion || 0));
    } catch (e) {
      setPaymentTypes([]);
      setPrincipal(0); setInterest(0); setFees(0); setPenalties(0);
      console.error("repayment template failed", e);
    }
  };

  useEffect(() => { loadTemplate(transactionDate); }, [loanId]);          
  useEffect(() => { loadTemplate(transactionDate); }, [transactionDate]); 

  const canSubmit = useMemo(
    () => Boolean(loanId && Number(amount) > 0 && transactionDate),
    [loanId, amount, transactionDate]
  );

  const onSubmit = async () => {
    if (!loanId || !canSubmit) return;
    setSaving(true);
    try {
      const payload: any = {
        dateFormat: "dd MMMM yyyy",
        locale: "en",
        transactionDate: toFineractDate(transactionDate),
        transactionAmount: Number(amount),
        paymentTypeId: paymentTypeId ? Number(paymentTypeId) : undefined,
        externalId: externalId || undefined,
        note: note || undefined,
        accountNumber: showPaymentDetails ? accountNumber || undefined : undefined,
        checkNumber: showPaymentDetails ? checkNumber || undefined : undefined,
        routingCode: showPaymentDetails ? routingCode || undefined : undefined,
        receiptNumber: showPaymentDetails ? receiptNumber || undefined : undefined,
        bankNumber: showPaymentDetails ? bankNumber || undefined : undefined,
      };

      // OpenAPI submit 
      const api: any = loansApi as any;
      if (api.executeLoanTransaction) {
        await api.executeLoanTransaction(Number(loanId), "repayment", payload);
      } else if (api.postLoansLoanIdTransactions) {
        await api.postLoansLoanIdTransactions(Number(loanId), "repayment", payload);
      }

      navigate(`/groups/${groupId}/loans-accounts/${loanId}/general`);
    } catch (e) {
      console.error("repayment failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Make Repayment", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Make Repayment</h2>

        <div className="space-y-6">
          {/* date */}
          <div className="space-y-2">
            <Label>Transaction Date*</Label>
            <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
          </div>

          {(principal + interest + fees + penalties > 0) && (
            <div className="grid grid-cols-2 gap-y-2">
              <div className="font-medium">Principal</div><div className="text-right">{principal}</div>
              <div className="font-medium">Interest</div><div className="text-right">{interest}</div>
              <div className="font-medium">Fees</div><div className="text-right">{fees}</div>
              <div className="font-medium">Penalties</div><div className="text-right">{penalties}</div>
            </div>
          )}

          {/* amount */}
          <div className="space-y-2">
            <Label>Transaction Amount*</Label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-700 text-sm">{currencyCode}</div>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* external id */}
          <div className="space-y-2">
            <Label>External Id</Label>
            <Input value={externalId} onChange={(e) => setExternalId(e.target.value)} />
          </div>

          {/* payment type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <AppSelect
              selectLabel=""
              selectValue={paymentTypeId}
              selectOnChange={setPaymentTypeId}
              selectPlaceholder="Select payment type"
              selectOptions={paymentTypes.map((p) => ({ id: p.id, name: p.name }))}
              selectClassname="w-full"
            />
          </div>

          {/* optional payment details */}
          <div className="flex items-center gap-3 pt-2">
            <input
              id="toggle-details"
              type="checkbox"
              checked={showPaymentDetails}
              onChange={(e) => setShowPaymentDetails(e.target.checked)}
            />
            <Label htmlFor="toggle-details" className={showPaymentDetails ? "text-rose-500" : ""}>
              Show Payment Details
            </Label>
          </div>

          {showPaymentDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Account #</Label><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></div>
              <div><Label>Cheque #</Label><Input value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} /></div>
              <div><Label>Routing Code</Label><Input value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} /></div>
              <div><Label>Receipt #</Label><Input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} /></div>
              <div><Label>Bank #</Label><Input value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} /></div>
            </div>
          )}

          {/* note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={!canSubmit || saving}
              onClick={onSubmit}
            >
              {saving ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakeRepayment;
