import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AssignLoanOfficer = () => {
  const navigate = useNavigate();

  // form state
  const [officerId, setOfficerId] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");

  // simple validation
  const canSubmit = Boolean(officerId && assignmentDate);

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
          { label: "Assign Loan Officer", current: true },
        ]}
      />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Assign Loan Officer</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* officer select */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="To Loan Officer*"
              selectPlaceholder="Select officer"
              selectValue={officerId}
              selectOnChange={setOfficerId}
              selectOptions={[]}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* assignment date */}
          <div className="w-full space-y-2">
            <Label>Assignment Date*</Label>
            <Input
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
            />
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

export default AssignLoanOfficer;
