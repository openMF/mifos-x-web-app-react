import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const RedeemShares = () => {
  const { clientId, sharesAccountId } = useParams();
  const navigate = useNavigate();

  const [requestedDate, setRequestedDate] = useState("");
  const [requestedShares, setRequestedShares] = useState("");

  const backToAccount = () => {
    if (clientId && sharesAccountId) {
      navigate(-1);
    } else if (clientId) {
      navigate(`/clients/${clientId}/shares`);
    } else {
      navigate(-1);
    }
  };

  const onSubmit = () => {
    console.log("Redeem Shares:", { requestedDate, requestedShares });
    backToAccount();
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Clients", href: "/clients" },
          { label: "Shares", href: clientId ? `/clients/${clientId}/shares` : "/clients" },
          { label: "Redeem Shares", current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Redeem Shares</h2>

          <div className="space-y-6">
            {/* Request Date */}
            <div className="space-y-2">
              <Label>Request Date*</Label>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>

            {/* Total No. of Shares */}
            <div className="space-y-2">
              <Label>Total No. of Shares*</Label>
              <Input
                type="number"
                value={requestedShares}
                onChange={(e) => setRequestedShares(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Current Price*/}
            <div className="space-y-2">
              <Label>Current Price*</Label>
              <Input  disabled readOnly placeholder="—" />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onSubmit}
                disabled={!requestedDate || !requestedShares}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemShares;
