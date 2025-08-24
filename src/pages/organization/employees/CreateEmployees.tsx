import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AppSelect from "@/components/custom/select/AppSelect";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { getConfiguration } from "@/lib/fineract-openapi";
import { StaffApi, OfficesApi, type GetOfficesResponse } from "@/fineract-api";

const staffApi = new StaffApi(getConfiguration());
const officesApi = new OfficesApi(getConfiguration());

const CreateEmployees = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<GetOfficesResponse[]>([]);

  // form state
  const [formData, setFormData] = useState({
    officeId: "",
    firstname: "",
    lastname: "",
    isLoanOfficer: false,
    mobileNo: "",
    joiningDate: new Date(),
  });

  // fetch offices on mount
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

  // handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.create3({
        officeId: Number(formData.officeId),
        firstname: formData.firstname,
        lastname: formData.lastname,
        isLoanOfficer: formData.isLoanOfficer,
        mobileNo: formData.mobileNo || undefined,
        joiningDate: format(formData.joiningDate, "yyyy-MM-dd"),
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      });
      navigate("/organization/employees");
    } catch (err) {
      console.error("Failed to create employee", err);
      alert("Failed to create employee");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Organization", href: "/organization" },
          { label: "Employees", href: "/organization/employees" },
          { label: "Create", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Employee</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* office selection */}
          <AppSelect
            selectLabel="Office*"
            selectValue={formData.officeId}
            selectPlaceholder="Select Office"
            selectClassname="w-full space-y-2"
            selectOnChange={(value) => setFormData((prev) => ({ ...prev, officeId: value }))}
            selectOptions={offices.map((o) => ({
              id: o.id?.toString() ?? "",
              name: o.name ?? "",
            }))}
          />

          {/* first name */}
          <div className="space-y-2">
            <Label>First Name*</Label>
            <Input
              value={formData.firstname}
              onChange={(e) => setFormData((prev) => ({ ...prev, firstname: e.target.value }))}
            />
          </div>

          {/* last name */}
          <div className="space-y-2">
            <Label>Last Name*</Label>
            <Input
              value={formData.lastname}
              onChange={(e) => setFormData((prev) => ({ ...prev, lastname: e.target.value }))}
            />
          </div>

          {/* loan officer checkbox */}
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.isLoanOfficer}
              onCheckedChange={(val) => setFormData((prev) => ({ ...prev, isLoanOfficer: Boolean(val) }))}
            />
            <Label className="text-md">Is Loan Officer</Label>
          </div>

          {/* mobile number */}
          <div className="space-y-2">
            <Label>Mobile Number for SMS</Label>
            <Input
              value={formData.mobileNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, mobileNo: e.target.value }))}
            />
          </div>

          {/* joining date picker */}
          <div className="space-y-2">
            <Label>Joining Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !formData.joiningDate && "text-muted-foreground")}
                >
                  {formData.joiningDate ? format(formData.joiningDate, "PPP") : "Pick a date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.joiningDate}
                  onSelect={(date) => date && setFormData((prev) => ({ ...prev, joiningDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* action buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/organization/employees")}>
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

export default CreateEmployees;
