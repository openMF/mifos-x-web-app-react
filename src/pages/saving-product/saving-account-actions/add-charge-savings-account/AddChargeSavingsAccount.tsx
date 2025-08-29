import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { Button } from "@/components/ui/button";

const AddChargeSavingsAccount = () => {
  const { groupId, accountId } = useParams();
  const navigate = useNavigate();

  const [chargeId, setChargeId] = useState<string>("");

  const backToAccount = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/general`);
    } else {
      navigate(-1);
    }
  };

  const onSubmit = () => {
    console.log("Selected charge id:", chargeId);
    backToAccount();
  };

  const chargeOptions = [
    { id: "1", name: "Monthly Fee" },
    { id: "2", name: "Dormancy Fee" },
    { id: "3", name: "Card Replacement" },
  ];

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Add Charge", current: true },
        ]}
      />

      {/* Centered card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Add Charge</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <AppSelect
                selectLabel="Charge"
                selectValue={chargeId}
                selectOnChange={setChargeId}
                selectPlaceholder="Select a charge"
                selectOptions={chargeOptions}
                selectClassname="w-full space-y-2"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button className="bg-[#0e77b7] hover:bg-[#0662a3]" onClick={onSubmit} disabled={!chargeId}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddChargeSavingsAccount;
