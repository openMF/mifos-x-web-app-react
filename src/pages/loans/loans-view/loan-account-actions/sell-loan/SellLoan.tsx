import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const SellLoan = () => {
  const navigate = useNavigate();

  // form state
  const [settlementDate, setSettlementDate] = useState("");
  const [purchasePriceRatio, setPurchasePriceRatio] = useState("");
  const [ownerExternalId, setOwnerExternalId] = useState("");
  const [transferExternalId, setTransferExternalId] = useState("");

  // validation 
  const canSubmit =
    Boolean(settlementDate) &&
    Boolean(purchasePriceRatio) &&
    Boolean(ownerExternalId);

  // submit handler
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
          { label: "Sell Loan", current: true },
        ]}
      />

      {/* main form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Sell Loan</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* settlement date */}
          <div className="space-y-2">
            <Label>Settlement Date*</Label>
            <Input
              type="date"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
            />
          </div>

          {/* purchase price ratio */}
          <div className="space-y-2">
            <Label>Purchase Price Ratio*</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={purchasePriceRatio}
              onChange={(e) => setPurchasePriceRatio(e.target.value)}
              placeholder="e.g. 1.00"
            />
          </div>

          {/* owner external id */}
          <div className="space-y-2">
            <Label>Owner External Id*</Label>
            <Input
              value={ownerExternalId}
              onChange={(e) => setOwnerExternalId(e.target.value)}
            />
          </div>

          {/* transfer external id (optional) */}
          <div className="space-y-2">
            <Label>Transfer External Id</Label>
            <Input
              value={transferExternalId}
              onChange={(e) => setTransferExternalId(e.target.value)}
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

export default SellLoan;
