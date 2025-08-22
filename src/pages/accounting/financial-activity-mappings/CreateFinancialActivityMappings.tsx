import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { Button } from "@/components/ui/button";
import { MappingFinancialActivitiesToAccountsApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// API client
const financialApi = new MappingFinancialActivitiesToAccountsApi(getConfiguration());

const CreateFinancialActivityMappings = () => {
  const navigate = useNavigate();

  // Template from server + filtered GL list for the chosen FA
  const [template, setTemplate] = useState<any>({});
  const [glList, setGlList] = useState<any[]>([]); 

  // Controlled form state
  const [formData, setFormData] = useState({
    financialActivityId: "",
    glAccountId: "",
  });

  // Helper: format identifiers to title-like labels
  const toTitle = (s?: string) =>
    (s || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Load template on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await financialApi.retrieveTemplate();
        setTemplate(res?.data ?? {});
      } catch (err) {
        console.error("Couldn't fetch template", err);
      }
    })();
  }, []);

  // When FA changes: set value and compute corresponding GL list by account type
  const handleFAChange = (val: string) => {
    // set selected FA
    setFormData((p) => ({ ...p, financialActivityId: val, glAccountId: "" }));

    const fa = (template?.financialActivityOptions || []).find((x: any) => String(x.id) === String(val));
    const t = fa?.mappedGLAccountType; 

    // pick the right GL array
    let list: any[] = [];
    if (t === "ASSET") list = template?.assetAccountOptions || [];
    else if (t === "LIABILITY") list = template?.liabilityAccountOptions || [];
    else if (t === "EQUITY") list = template?.equityAccountOptions || [];
    else if (t === "INCOME") list = template?.incomeAccountOptions || [];
    else if (t === "EXPENSE") list = template?.expenseAccountOptions || [];

    setGlList(list);
  };

  // GL select handler
  const handleGLChange = (val: string) => {
    setFormData((p) => ({ ...p, glAccountId: val }));
  };

  // Build select options for FA and GL
  const faOptions = (template?.financialActivityOptions || []).map((o: any) => ({
    id: String(o.id),
    name: `(${o.id}) ${toTitle(o.name)}`,
  }));

  const glOptions = glList.map((o: any) => ({
    id: String(o.id),
    name: o.glCode ? `(${o.glCode}) ${o.name}` : o.name,
  }));

  // Submit mapping: validate then create
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.financialActivityId || !formData.glAccountId) {
      alert("Select both fields.");
      return;
    }
    try {
      await financialApi.createGLAccount({
        financialActivityId: Number(formData.financialActivityId),
        glAccountId: Number(formData.glAccountId),
      });
      alert("Mapping created successfully!");
      navigate("/accounting/financial-activity-mappings");
    } catch (err) {
      console.error("Failed to create mapping", err);
      alert("Failed to create mapping");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Accounting", href: "/accounting" },
          { label: "Financial Activity Mappings", href: "/accounting/financial-activity-mappings" },
          { label: "Create", current: true },
        ]}
      />

      {/* Form card */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Financial Activity Mapping</h2>

        {/* Create mapping form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Financial Activity select */}
          <AppSelect
            selectLabel="Financial Activity*"
            selectPlaceholder="Select Financial Activity"
            selectValue={formData.financialActivityId}
            selectOnChange={handleFAChange}
            selectOptions={faOptions}
            selectClassname="w-full space-y-2"
          />

          {/* GL Account select */}
          <AppSelect
            selectLabel="GL Account*"
            selectPlaceholder="Select GL Account"
            selectValue={formData.glAccountId}
            selectOnChange={handleGLChange}
            selectOptions={glOptions}
            selectClassname="w-full space-y-2"
          />

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/accounting/financial-activity-mappings")}>
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

export default CreateFinancialActivityMappings;
