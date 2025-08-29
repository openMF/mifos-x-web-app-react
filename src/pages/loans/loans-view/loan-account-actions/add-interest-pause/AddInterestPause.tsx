import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AddInterestPause = () => {
  const navigate = useNavigate();

  // form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maturityText] = useState<string>("");

  // simple validation
  const canSubmit = Boolean(startDate && endDate);

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
          { label: "Add Interest Pause", current: true },
        ]}
      />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Add Interest Pause</h2>

        {/* maturity date info */}
        <div className="text-sm text-muted-foreground mb-4">
          Maturity Date{maturityText ? ` : ${maturityText}` : ""}
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* start date */}
          <div className="space-y-2">
            <Label>Start Date*</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* end date */}
          <div className="space-y-2">
            <Label>End Date*</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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

export default AddInterestPause;
