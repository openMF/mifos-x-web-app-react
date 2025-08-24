import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import AppSelect from "@/components/custom/select/AppSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { OfficesApi, StaffApi, type GetOfficesResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const officesApi = new OfficesApi(getConfiguration());
const staffApi = new StaffApi(getConfiguration());

const BulkLoanReassignment = () => {
  const navigate = useNavigate();

  const [offices, setOffices] = useState<GetOfficesResponse[]>([]);
  const [fromLoanOfficers, setFromLoanOfficers] = useState<any[]>([]);
  const [toLoanOfficers, setToLoanOfficers] = useState<any[]>([]);
  const [officerTemplate, setOfficerTemplate] = useState<any>();

  // form state
  const [formData, setFormData] = useState({
    officeId: "",
    assignmentDate: "",
    fromLoanOfficerId: "",
    toLoanOfficerId: "",
    selectedLoans: [] as number[],
  });

  // fetch offices 
  useEffect(() => {
    (async () => {
      try {
        const res = await officesApi.retrieveOffices();
        setOffices(res.data || []);
      } catch (err) {
        console.error("Failed to fetch offices", err);
      }
    })();
  }, []);

  // handle form field updates
  const handleChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // toggle loan selection (clients/groups)
  const handleLoanToggle = (loanId: number, checked: boolean) =>
    setFormData((prev) => ({
      ...prev,
      selectedLoans: checked
        ? [...prev.selectedLoans, loanId]
        : prev.selectedLoans.filter((id) => id !== loanId),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Organization", href: "/organization" },
          { label: "Bulk Loan Reassignment", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Bulk Loan Reassignment</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Office selection */}
          <div className="w-full space-y-2">
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

          {/* Assignment Date */}
          <div className="w-full space-y-2">
            <Label>Assignment Date*</Label>
            <Input
              type="date"
              value={formData.assignmentDate}
              onChange={(e) => handleChange("assignmentDate", e.target.value)}
              required
            />
          </div>

          {/* From Loan Officer */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="From loan officer*"
              selectPlaceholder="Select loan officer"
              selectValue={formData.fromLoanOfficerId}
              selectOnChange={(val) => handleChange("fromLoanOfficerId", val)}
              selectClassname="w-full space-y-2"
              selectOptions={fromLoanOfficers.map((o) => ({
                id: o.id?.toString() || "",
                name: o.displayName || "",
              }))}
            />
          </div>

          {/* To Loan Officer */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="To loan officer*"
              selectPlaceholder="Select loan officer"
              selectValue={formData.toLoanOfficerId}
              selectOnChange={(val) => handleChange("toLoanOfficerId", val)}
              selectClassname="w-full space-y-2"
              selectOptions={toLoanOfficers.map((o) => ({
                id: o.id?.toString() || "",
                name: o.displayName || "",
              }))}
            />
          </div>

          {/* Loan selection (Clients & Groups) */}
          {officerTemplate && (
            <div className="flex flex-col gap-6">
              {/* Clients */}
              <div className="w-full space-y-2">
                <Label>Clients</Label>
                <div className="rounded-md border p-4 space-y-3">
                  {officerTemplate.accountSummaryCollection.clients?.map(
                    (client: any) => (
                      <div key={client.id}>
                        <div className="font-semibold">{client.displayName}</div>
                        <div className="mt-1 space-y-1 pl-2">
                          {client.loans.map((loan: any) => (
                            <label
                              key={loan.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={formData.selectedLoans.includes(loan.id)}
                                onCheckedChange={(c) =>
                                  handleLoanToggle(loan.id, !!c)
                                }
                              />
                              <span>
                                {loan.productName} ({loan.accountNo})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Groups */}
              <div className="w-full space-y-2">
                <Label>Groups</Label>
                <div className="rounded-md border p-4 space-y-3">
                  {officerTemplate.accountSummaryCollection.groups?.map(
                    (group: any) => (
                      <div key={group.id}>
                        <div className="font-semibold">{group.displayName}</div>
                        <div className="mt-1 space-y-1 pl-2">
                          {group.loans.map((loan: any) => (
                            <label
                              key={loan.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox />
                              <span>
                                {loan.productName} ({loan.accountNo})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/organization")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={
                !formData.officeId ||
                !formData.assignmentDate ||
                !formData.toLoanOfficerId
              }
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkLoanReassignment;
