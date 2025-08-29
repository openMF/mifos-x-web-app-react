import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";

const GroupsAddRoleCommitteeTab = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clientId: "",
    roleId: "",
  });

  // Basic form validation
  const canSubmit = form.clientId !== "" && form.roleId !== "";

  // Handle submit
  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    navigate(-1); 
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Group" },
          { label: "Add Role", current: true },
        ]}
      />

      {/* Card wrapper */}
      <div className="mt-6 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-700 shadow p-8 max-w-2xl ml-auto mr-auto">
        <form className="space-y-8" onSubmit={handleConfirm}>
          <h1 className="text-2xl font-semibold">Add Role</h1>

          {/* Client dropdown */}
          <AppSelect
            selectLabel="Client*"
            selectPlaceholder="Select client"
            selectValue={form.clientId}
            selectOnChange={(v) => setForm((s) => ({ ...s, clientId: v }))}
            selectOptions={[]} 
            selectClassname="w-full space-y-2"
          />

          {/* Role dropdown */}
          <AppSelect
            selectLabel="Role*"
            selectPlaceholder="Select role"
            selectValue={form.roleId}
            selectOnChange={(v) => setForm((s) => ({ ...s, roleId: v }))}
            selectOptions={[]} 
            selectClassname="w-full space-y-2"
          />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[100px] bg-[#1074b9] hover:bg-[#1074c9] text-white disabled:opacity-60"
            >
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupsAddRoleCommitteeTab;
