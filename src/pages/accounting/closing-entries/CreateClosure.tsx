import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";

import { getConfiguration } from "@/lib/fineract-openapi";
import { AccountingClosureApi, OfficesApi, type GetOfficesResponse } from "@/fineract-api";

// API clients
const officesApi = new OfficesApi(getConfiguration());
const closureApi = new AccountingClosureApi(getConfiguration());

const CreateClosure = () => {
  const navigate = useNavigate();

  // Offices list + form state
  const [offices, setOffices] = useState<GetOfficesResponse[]>([]);

  const [formData, setFormData] = useState({
    officeId: "",
    closingDate: "",
    comments: "",
  });

  // Load offices on mount
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await officesApi.retrieveOffices();
        setOffices(response.data || []);
      } catch (err) {
        console.error("Failed to fetch offices", err);
      }
    };
    fetchOffices();
  }, []);

  // Generic field updater
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Submit: validate, format date, call API, then navigate
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.officeId || !formData.closingDate) {
      alert("Please fill all required fields.");
      return;
    }

    const formattedDate = new Date(formData.closingDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    try {
      await closureApi.createGLClosure({
        officeId: Number(formData.officeId),
        closingDate: formattedDate,
        comments: formData.comments,
        locale: "en",
        dateFormat: "dd MMMM yyyy",
      });
      alert("Closure created successfully!");
      navigate("/accounting/closing-entries");
    } catch (err) {
      console.error("Failed to create closure", err);
      alert("Failed to create closure");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Accounting", href: "/accounting" },
          { label: "Closing Entries", href: "/accounting/closing-entries" },
          { label: "Create", current: true },
        ]}
      />

      {/* Form card */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Closing Entry</h2>

        {/* Create Closure form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Office select */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Office*"
              selectPlaceholder="Select Office"
              selectValue={formData.officeId}
              selectOnChange={(val) => handleChange("officeId", val)}
              selectOptions={offices.map((o) => ({
                id: o.id?.toString() || "",
                name: o.name || "",
              }))}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* Closing date */}
          <div className="w-full space-y-2">
            <Label>Closing Date*</Label>
            <Input
              type="date"
              value={formData.closingDate}
              onChange={(e) => handleChange("closingDate", e.target.value)}
              required
            />
          </div>

          {/* Optional comments */}
          <div className="w-full space-y-2">
            <Label>Comments</Label>
            <Input
              value={formData.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/accounting/closing-entries")}
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

export default CreateClosure;
