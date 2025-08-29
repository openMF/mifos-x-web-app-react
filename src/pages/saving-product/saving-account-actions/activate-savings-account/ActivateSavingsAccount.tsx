import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ActivateSavingsAccount = () => {
  const { groupId, accountId } = useParams();
  const navigate = useNavigate();

  const [activatedOnDate, setActivatedOnDate] = useState<string>("");

  const backToAccount = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/general`);
    } else {
      navigate(-1);
    }
  };

  const onSubmit = () => {
    console.log("Activated On Date:", activatedOnDate);
    backToAccount();
  };

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Activate", current: true },
        ]}
      />

      {/* Centered form card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Activate</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Activated On Date*
              </Label>
              <Input
                type="date"
                value={activatedOnDate}
                onChange={(e) => setActivatedOnDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button className="bg-[#0e77b7] hover:bg-[#0662a3]" onClick={onSubmit} disabled={!activatedOnDate}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateSavingsAccount;
