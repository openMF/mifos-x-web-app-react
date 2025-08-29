import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const UndoApprovalSavingsAccount = () => {
  const { groupId, accountId } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState("");

  const backToTransactions = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/transactions`);
    } else {
      navigate(-1);
    }
  };

  const onSubmit = () => {
    console.log("Undo Approval Note:", note);
    backToTransactions();
  };

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Undo Approval", current: true },
        ]}
      />

      {/* Card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Undo Approval</h2>

          <div className="space-y-6">
            {/* Note */}
            <div className="space-y-2">
              <Label>Note</Label>
              <Input
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToTransactions}>
                Cancel
              </Button>
              <Button className="bg-[#0e77b7] hover:bg-[#0662a3]" onClick={onSubmit}>Confirm</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UndoApprovalSavingsAccount;
