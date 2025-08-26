import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

const CreateRolesAndPermissions = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const handleChange = (field: "name" | "description", value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // structure only
    console.log("Submit payload:", form);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "System", href: "/system" },
          { label: "Roles and Permissions", href: "/system/roles-and-permissions" },
          { label: "Add", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Add</h2>

        <form className="space-y-8 max-w-2xl mx-auto" onSubmit={handleSubmit}>
          {/* Name* */}
          <div className="w-full space-y-2">
            <Label>Name*</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          {/* Description* */}
          <div className="w-full space-y-2">
            <Label>Description*</Label>
            <Input
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/system/roles-and-permissions")}
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

export default CreateRolesAndPermissions;
