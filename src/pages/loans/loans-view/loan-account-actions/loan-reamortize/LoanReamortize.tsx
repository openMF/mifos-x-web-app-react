import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const LoanReamortize = () => {
  const navigate = useNavigate();

  // form state
  const [reason, setReason] = useState("");
  const [externalId, setExternalId] = useState("");

  // handle submit
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(-1);
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Re-Amortize", current: true },
        ]}
      />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Re-Amortize</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* external id */}
          <div className="space-y-2">
            <Label>External Id</Label>
            <Input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
            />
          </div>

          {/* actions */}
          <div className="flex gap-4 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1074b9] hover:bg-[#1074c9] text-white">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanReamortize;
