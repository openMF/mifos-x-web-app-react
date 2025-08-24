import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs"


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const EditAdhocQuery = () => {

    const navigate=useNavigate();

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Organization", href: "/organization" },
                    { label: "Adhoc Query", href: "/organization/adhoc-query" },
                    { label: "Edit", current: true },
                ]}
            />

            <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6">Create Adhoc Query</h2>

                <form className="space-y-6" >
                    <div className="space-y-2">
                        <Label>Name*</Label>
                        <Input

                        />
                    </div>

                    <div className="space-y-2">
                        <Label>SQL Query*</Label>
                        <Input

                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Insert into table*</Label>
                        <Input

                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Table Fields*</Label>
                        <Input

                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input

                        />
                    </div>

                    {/* <AppSelect
                        selectLabel="Report Run Frequency"
                        selectValue={formData.reportRunFrequency}
                        selectPlaceholder="Select frequency"
                        selectClassname="w-full space-y-2"
                        selectOnChange={(val) =>
                            setFormData((prev) => ({ ...prev, reportRunFrequency: val }))
                        }
                        selectOptions={[
                            { id: "daily", name: "Daily" },
                            { id: "weekly", name: "Weekly" },
                            { id: "monthly", name: "Monthly" },
                        ]}
                    /> */}

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            
                        />
                        <Label className="text-md">Active</Label>
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={() => navigate("/organization/adhoc-query")}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#1074b9] hover:bg-[#1074c9] text-white">
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditAdhocQuery
