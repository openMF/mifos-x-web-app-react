import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ApproveLoan = () => {
  const navigate = useNavigate();
  const { loanId } = useParams();

  // form state
  const [approvedOn, setApprovedOn] = useState("");
  const [expectedDisbursementOn, setExpectedDisbursementOn] = useState("");
  const [currencyCode] = useState("");         
  const [approvedAmountDisplay] = useState(""); 
  const [transactionAmount, setTransactionAmount] = useState("");
  const [note, setNote] = useState("");

  // validation
  const canSubmit = approvedOn && transactionAmount;

  // handle submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !loanId) return;

    const payload: any = {
      locale: "en",
      dateFormat: "yyyy-MM-dd",
      approvedOnDate: approvedOn,
      approvedLoanAmount: Number(transactionAmount),
      note: note || undefined,
    };
    if (expectedDisbursementOn) {
      payload.expectedDisbursementDate = expectedDisbursementOn;
    }

    navigate(-1);
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Clients", href: "/clients" },
          { label: "NewTest test", href: `/clients/${loanId}/general` }, 
          { label: "Approve", current: true },
        ]}
      />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto mt-6">
        <h2 className="text-2xl font-semibold mb-6">Approve</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* approved on */}
          <div className="w-full space-y-2">
            <Label>Approved On*</Label>
            <Input
              type="date"
              value={approvedOn}
              onChange={(e) => setApprovedOn(e.target.value)}
            />
          </div>

          {/* expected disbursement */}
          <div className="w-full space-y-2">
            <Label>Expected disbursement on</Label>
            <Input
              type="date"
              value={expectedDisbursementOn}
              onChange={(e) => setExpectedDisbursementOn(e.target.value)}
            />
          </div>

          {/* approved amount */}
          <div className="w-full space-y-2">
            <Label>Approved Amount*</Label>
            <div className="flex items-center gap-3">
              <Input value={currencyCode} readOnly className="w-24" />
              <Input value={approvedAmountDisplay} readOnly />
            </div>
          </div>

          {/* transaction amount */}
          <div className="w-full space-y-2">
            <Label>Transaction Amount*</Label>
            <Input
              type="number"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Enter amount"
            />
          </div>

          {/* note */}
          <div className="w-full space-y-2">
            <Label>Note</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* actions */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveLoan;
