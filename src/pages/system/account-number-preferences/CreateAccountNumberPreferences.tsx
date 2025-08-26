import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";

const ACCOUNT_TYPES = [
  { id: "CLIENT", name: "Client" },
  { id: "GROUP", name: "Group" },
  { id: "CENTER", name: "Center" },
  { id: "LOAN", name: "Loan" },
  { id: "SAVINGS", name: "Savings" },
  { id: "SHARE", name: "Share" },
];

const CreateAccountNumberPreferences = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    accountType: "",
    prefix: "",
  });

  const handleChange = (field: "accountType" | "prefix", value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit payload:", form);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "System", href: "/system" },
          { label: "Account Number Preferences", href: "/system/account-number-preferences" },
          { label: "Create", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create</h2>

        <form className="space-y-8 max-w-2xl mx-auto" onSubmit={handleSubmit}>
          {/* Account Type* */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Account Type*"
              selectPlaceholder="Select"
              selectValue={form.accountType}
              selectOnChange={(val) => handleChange("accountType", val)}
              selectClassname="w-full"
              selectOptions={ACCOUNT_TYPES}
            />
          </div>

          {/* Prefix Field */}
          <div className="w-full space-y-2">
            <Label>Prefix Field</Label>
            <Input
              value={form.prefix}
              onChange={(e) => handleChange("prefix", e.target.value)}
              placeholder=""
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/system/account-number-preferences")}
            >
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

export default CreateAccountNumberPreferences;
