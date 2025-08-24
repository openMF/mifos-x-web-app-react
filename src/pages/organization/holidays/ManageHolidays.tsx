import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { getConfiguration } from "@/lib/fineract-openapi";
import { OfficesApi, type GetOfficesResponse } from "@/fineract-api";

// repayment scheduling options
const REPAYMENT_TYPES = [
  { id: "RESCHEDULE_TO_NEXT_MEETING", name: "Reschedule to Next Meeting" },
  { id: "RESCHEDULE_TO_NEXT_REPAYMENT", name: "Reschedule to Next Repayment" },
  { id: "NO_REPAYMENT", name: "No Repayment" },
];

const officesApi = new OfficesApi(getConfiguration());

const ManageHolidays = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<GetOfficesResponse[]>([]);

  // fetch offices
  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const res = await officesApi.retrieveOffices();
        setOffices(res.data);
      } catch (err) {
        console.error("Failed to fetch office", err);
      }
    };
    fetchOffice();
  }, []);

  // form state
  const [form, setForm] = useState({
    name: "",
    fromDate: "",
    toDate: "",
    repaymentType: "",
    description: "",
    offices: [] as number[],
  });

  const handleChange = (field: keyof typeof form, value: string) =>
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
          { label: "Organization", href: "/organization" },
          { label: "Manage Holidays", href: "/organization/holidays" },
          { label: "Create", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="space-y-2">
            <Label>Name*</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <Label>From Date*</Label>
            <Input
              type="date"
              value={form.fromDate}
              onChange={(e) => handleChange("fromDate", e.target.value)}
              required
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label>To Date*</Label>
            <Input
              type="date"
              value={form.toDate}
              onChange={(e) => handleChange("toDate", e.target.value)}
              required
            />
          </div>

          {/* Repayment Scheduling Type */}
          <div className="space-y-2 w-full">
            <AppSelect
              selectLabel="Repayment Scheduling Type*"
              selectPlaceholder="Select"
              selectValue={form.repaymentType}
              selectOnChange={(val) => handleChange("repaymentType", val)}
              selectClassname="w-full space-y-2"
              selectOptions={REPAYMENT_TYPES}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          {/* Offices checkboxes */}
          <div className="space-y-3 pt-2">
            <Label>Select applicable offices</Label>
            {offices.map((o: any) => (
              <div key={o.id} className="flex items-center gap-3">
                <Checkbox
                  id={`office-${o.id}`}
                  checked={form.offices.includes(o.id)}
                  onCheckedChange={(v) => {
                    setForm((prev) => {
                      const updated = new Set(prev.offices);
                      v ? updated.add(o.id) : updated.delete(o.id);
                      return { ...prev, offices: Array.from(updated) };
                    });
                  }}
                />
                <Label htmlFor={`office-${o.id}`} className="select-none">
                  {o.name}
                </Label>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/organization/holidays")}
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

export default ManageHolidays;
