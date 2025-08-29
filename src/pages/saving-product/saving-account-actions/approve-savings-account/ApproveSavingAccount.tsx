import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Label } from "@/components/ui/label";

const ApproveSavingAccount = () => {
  const { groupId, accountId } = useParams();
  const navigate = useNavigate();

  const [approvedOnDate, setApprovedOnDate] = useState("");
  const [note, setNote] = useState("");

  const backToAccount = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/general`);
    } else {
      navigate(-1);
    }
  };

  const onSubmit = () => {
    console.log({ approvedOnDate, note });
    backToAccount();
  };

  return (
    <div className="min-h-screen px-6 py-10">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Approve", current: true },
        ]}
      />

      {/* centered card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Approve</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Approved On Date*
              </Label>
              <Input
                type="date"
                value={approvedOnDate}
                onChange={(e) => setApprovedOnDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Note</Label>
              <Input
                placeholder="Optional note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button className="bg-[#0e77b7] hover:bg-[#0662a3]" onClick={onSubmit} disabled={!approvedOnDate}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveSavingAccount;
