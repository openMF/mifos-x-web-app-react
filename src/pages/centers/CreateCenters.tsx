import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import AppSelect from "@/components/custom/select/AppSelect";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { getConfiguration } from "@/lib/fineract-openapi";
import {
  CentersApi,
  OfficesApi,
  StaffApi,
  type GetOfficesResponse,
  type StaffData,
} from "@/fineract-api";

// API instances
const centersApi = new CentersApi(getConfiguration());
const officesApi = new OfficesApi(getConfiguration());
const staffApi = new StaffApi(getConfiguration());

const CreateCenters = () => {
  const navigate = useNavigate();

  // Dropdown data
  const [offices, setOffices] = useState<GetOfficesResponse[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    officeId: "",
    staffId: "",
    active: false,
    externalId: "",
    submittedOnDate: "",
    activationDate: "",
  });

  // Fetch offices + staff on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [officesRes, staffRes] = await Promise.all([
          officesApi.retrieveOffices(),
          staffApi.retrieveAll16(),
        ]);
        const officeItems = Array.from(officesRes.data ?? []);
        const staffItems = Array.from(staffRes.data ?? []);
        setOffices(officeItems);
        setStaff(staffItems);
      } catch (err) {
        console.error("Failed to fetch offices/staff", err);
      }
    };

    fetchInitialData();
  }, []);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await centersApi.create7({
        ...formData,
        officeId: Number(formData.officeId),
        active: formData.active,
      });
      navigate("/centers");
    } catch (err) {
      console.error("Failed to create center", err);
      alert("Failed to create center");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Centers", href: "/centers" },
          { label: "Create", current: true },
        ]}
      />

      {/* Form card */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Center</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Center Name */}
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

          {/* Office select */}
          <AppSelect
            selectLabel="Office*"
            selectValue={formData.officeId}
            selectPlaceholder="Select Office"
            selectClassname="w-full space-y-2"
            selectOnChange={(value) =>
              setFormData((prev) => ({ ...prev, officeId: value }))
            }
            selectOptions={offices.map((o) => ({
              id: o.id?.toString() ?? "",
              name: o.name ?? "",
            }))}
          />

          {/* Staff select */}
          <AppSelect
            selectLabel="Staff"
            selectValue={formData.staffId}
            selectPlaceholder="Select Staff"
            selectClassname="w-full space-y-2"
            selectOnChange={(value) =>
              setFormData((prev) => ({ ...prev, staffId: value }))
            }
            selectOptions={staff.map((s) => ({
              id: s.id?.toString() ?? "",
              name: s.displayName ?? "",
            }))}
          />

          {/* Active toggle */}
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.active}
              onCheckedChange={(val) =>
                setFormData((prev) => ({ ...prev, active: Boolean(val) }))
              }
            />
            <Label className="text-md">Active</Label>
          </div>

          {/* Activation date */}
          {formData.active && (
            <div className="space-y-2">
              <Label>Activation Date</Label>
              <Input
                type="date"
                value={formData.activationDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    activationDate: e.target.value,
                  }))
                }
              />
            </div>
          )}

          {/* External ID */}
          <div className="space-y-2">
            <Label>External Id</Label>
            <Input
              value={formData.externalId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, externalId: e.target.value }))
              }
            />
          </div>

          {/* Submitted On date */}
          <div className="space-y-2">
            <Label>Submitted On*</Label>
            <Input
              type="date"
              value={formData.submittedOnDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  submittedOnDate: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/centers")}
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

export default CreateCenters;
