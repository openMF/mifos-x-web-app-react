import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { FundsApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const fundsApi = new FundsApi(getConfiguration());

const CreateFunds = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    externalId: "",
  });

  // handle create fund
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await fundsApi.createFund({
        name: formData.name,
        externalId: formData.externalId || undefined,
      });

      navigate("/organization/manage-funds");
    } catch (err) {
      console.error("Failed to create fund", err);
      alert("Failed to create fund");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Organization", href: "/organization" },
          { label: "Manage Funds", href: "/organization/manage-funds" },
          { label: "Create", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Fund Name */}
          <div className="space-y-2">
            <Label>Name*</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* External Id */}
          <div className="space-y-2">
            <Label>External Id</Label>
            <Input
              value={formData.externalId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  externalId: e.target.value,
                }))
              }
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/organization/manage-funds")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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

export default CreateFunds;
