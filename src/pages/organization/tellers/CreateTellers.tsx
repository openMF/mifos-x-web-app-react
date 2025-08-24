import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";

import { TellerCashManagementApi, OfficesApi, type GetOfficesResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const tellersApi = new TellerCashManagementApi(getConfiguration());
const officesApi = new OfficesApi(getConfiguration());

const CreateTellers = () => {
  const navigate = useNavigate();

  const [offices, setOffices] = useState<GetOfficesResponse[]>([]);

  const [formData, setFormData] = useState({
    tellerName: "",
    officeId: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "", // true = active, false = inactive
  });

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await officesApi.retrieveOffices();
        setOffices(res.data || []);
      } catch (err) {
        console.error("Failed to fetch offices", err);
      }
    };
    fetchOffices();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    // const { tellerName, officeId, startDate } = formData;

    // if (!tellerName || !officeId || !startDate) {
    //   alert("Please fill all required fields.");
    //   return;
    // }

    // try {
    //   await tellersApi.createTeller({
    //     name: formData.tellerName,
    //     officeId: Number(formData.officeId),
    //     description: formData.description,
    //     startDate: formData.startDate,
    //     endDate: formData.endDate || undefined,
    //     status: formData.status as "ACTIVE" | "INACTIVE",
    //     locale: "en",
    //     dateFormat: "yyyy-MM-dd",
    //   });
    //   alert("Teller created successfully!");
    //   navigate("/organization/tellers");
    // } catch (err) {
    //   console.error("Failed to create teller", err);
    //   alert("Failed to create teller");
    // }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Organization", href: "/organization" },
          { label: "Tellers", href: "/organization/tellers" },
          { label: "Create", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Teller</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Teller Name */}
          <div className="space-y-2">
            <Label>Teller Name*</Label>
            <Input
              value={formData.tellerName}
              onChange={(e) => handleChange("tellerName", e.target.value)}
              required
            />
          </div>

          {/* Office Select */}
          <div className="space-y-2">
            <AppSelect
              selectLabel="Office*"
              selectPlaceholder="Select Office"
              selectValue={formData.officeId}
              selectOnChange={(val) => handleChange("officeId", val)}
              selectClassname="w-full space-y-2"
              selectOptions={offices.map((o) => ({
                id: o.id?.toString() || "",
                name: o.name || "",
              }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date*</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              required
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
          </div>

          {/* Status Select */}
          <div className="space-y-2">
            <AppSelect
              selectLabel="Status*"
              selectPlaceholder="Select Status"
              selectValue={formData.status}
              selectOnChange={(val) => handleChange("status", val)}
              selectClassname="w-full space-y-2"
              selectOptions={[
                { id: "true", name: "Active" },
                { id: "false", name: "Inactive" },
              ]}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/organization/tellers")}>
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

export default CreateTellers;
