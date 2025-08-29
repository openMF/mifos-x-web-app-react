import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import AppSelect from "@/components/custom/select/AppSelect";

const AddLoanCharge = () => {
  const navigate = useNavigate();
  const { id: groupId } = useParams();

  // form state
  const [chargeId, setChargeId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [chargeCalculation, setChargeCalculation] = useState<string>(""); 
  const [chargeTime, setChargeTime] = useState<string>("");              
  const [dueOn, setDueOn] = useState<string>("");

  const chargeOptions = [
    { id: "1", name: "Processing Fee (USD)", calc: "Flat", time: "Specified due date" },
    { id: "2", name: "Late Fee (INR)", calc: "Percent", time: "Overdue on" },
  ];

  const needsDueDate = useMemo(
    () => chargeTime.toLowerCase().includes("due"),
    [chargeTime]
  );

  // when user selects a charge, populate meta fields
  const onChangeCharge = (val: string) => {
    setChargeId(val);
    const meta = chargeOptions.find(o => o.id === val);
    setChargeCalculation(meta?.calc ?? "");
    setChargeTime(meta?.time ?? "");
  };

  // form can submit only if required fields are filled
  const canSubmit = chargeId && amount && (!needsDueDate || dueOn);

  // handle confirm submit
  const onSubmit = async () => {
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
          { label: "GroupTest", href: `/groups/${groupId ?? ""}/general` },
          { label: "Add Loan Charge", current: true },
        ]}
      />

      {/* centered form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Add Loan Charge</h2>

        <div className="space-y-6">
          {/* Charge dropdown */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Charge"
              selectPlaceholder="Select charge"
              selectValue={chargeId}
              selectOnChange={onChangeCharge}
              selectOptions={[]}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* Amount input */}
          <div className="w-full space-y-2">
            <Label>Amount*</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full"
              min="0"
              step="0.01"
            />
          </div>

          {/* Charge Calculation */}
          <div className="w-full space-y-2">
            <Label>Charge Calculation</Label>
            <Input value={chargeCalculation} readOnly className="w-full" />
          </div>

          {/* Charge Time */}
          <div className="w-full space-y-2">
            <Label>Charge Time</Label>
            <Input value={chargeTime} readOnly className="w-full" />
          </div>

          {/* Due On (only if needed) */}
          {needsDueDate && (
            <div className="w-full space-y-2">
              <Label>Due On*</Label>
              <Input
                type="date"
                value={dueOn}
                onChange={(e) => setDueOn(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLoanCharge;
