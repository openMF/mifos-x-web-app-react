import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import AppSelect from "@/components/custom/select/AppSelect";

const LoanReschedule = () => {
  const navigate = useNavigate();

  // form state
  const [fromInstallmentOn, setFromInstallmentOn] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [submittedOn, setSubmittedOn] = useState("");
  const [comments, setComments] = useState("");

  // checkboxes
  const [chgRepaymentDate, setChgRepaymentDate] = useState(false);
  const [midTermGrace, setMidTermGrace] = useState(false);
  const [extendPeriod, setExtendPeriod] = useState(false);
  const [adjustRates, setAdjustRates] = useState(false);

  // validation
  const canSubmit = Boolean(fromInstallmentOn && submittedOn && reasonId);

  // handle submit
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    navigate(-1);
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Reschedule", current: true },
        ]}
      />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Reschedule</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* reschedule from date */}
          <div className="space-y-2">
            <Label>Reschedule from Installment On*</Label>
            <Input
              type="date"
              value={fromInstallmentOn}
              onChange={(e) => setFromInstallmentOn(e.target.value)}
            />
          </div>

          {/* reason dropdown */}
          <div className="space-y-2">
            <AppSelect
              selectLabel="Reason for Rescheduling*"
              selectPlaceholder="Select reason"
              selectValue={reasonId}
              selectOnChange={setReasonId}
              selectOptions={[]}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* submitted on */}
          <div className="space-y-2">
            <Label>Submitted On*</Label>
            <Input
              type="date"
              value={submittedOn}
              onChange={(e) => setSubmittedOn(e.target.value)}
            />
          </div>

          {/* comments */}
          <div className="space-y-2">
            <Label>Comments</Label>
            <Input
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          {/* checkboxes */}
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <Checkbox
                checked={chgRepaymentDate}
                onCheckedChange={(v) => setChgRepaymentDate(Boolean(v))}
              />
              <span>Change Repayment Date</span>
            </label>

            <label className="flex items-center gap-3">
              <Checkbox
                checked={midTermGrace}
                onCheckedChange={(v) => setMidTermGrace(Boolean(v))}
              />
              <span>Introduce Mid-term grace periods</span>
            </label>

            <label className="flex items-center gap-3">
              <Checkbox
                checked={extendPeriod}
                onCheckedChange={(v) => setExtendPeriod(Boolean(v))}
              />
              <span>Extend Repayment Period</span>
            </label>

            <label className="flex items-center gap-3">
              <Checkbox
                checked={adjustRates}
                onCheckedChange={(v) => setAdjustRates(Boolean(v))}
              />
              <span>Adjust interest rates for remainder of loan</span>
            </label>
          </div>

          {/* actions */}
          <div className="flex gap-4 pt-2">
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

export default LoanReschedule;
