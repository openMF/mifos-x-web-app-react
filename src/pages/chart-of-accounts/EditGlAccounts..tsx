import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";

import { GeneralLedgerAccountApi, type GetGLAccountsTemplateResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

//gl accounts base api
const glApi = new GeneralLedgerAccountApi(getConfiguration());

const EditGlAccounts = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    //gives a template for editing
    const [template, setTemplate] = useState<GetGLAccountsTemplateResponse | null>(null);

    //stores the state for account type and usage
    const [selectedAccountType, setSelectedAccountType] = useState<string>('');
    const [selectedAccountUsage, setSelectedAccountUsage] = useState<string>('');

    //stores the state for parent and tag options
    const [parentOptions, setParentOptions] = useState<any[]>([]);
    const [tagOptions, setTagOptions] = useState<any[]>([]);

    //stores the state for manual entries

    //stores the data of the form
    const [formData, setFormData] = useState({
        type: '',
        name: '',
        usage: '',
        glCode: '',
        parentId: '',
        tagId: '',
        manualEntriesAllowed: false,
        description: ''
    })

    //gets the data with respect to each ID
    useEffect(() => {
        const fetchGlAccounts = async () => {

            try {
                const response = await glApi.retreiveAccount(Number(id));
                const acc = response.data;

                setFormData({
                    type: acc.type?.id?.toString() ?? "",
                    usage: acc.usage?.id?.toString() ?? "",
                    name: acc.name ?? "",
                    glCode: acc.glCode ? acc.glCode.toString() : "",
                    parentId: acc.parentId?.toString() || '',
                    tagId: acc.tagId?.toString() || '',
                    manualEntriesAllowed: acc.manualEntriesAllowed ?? false,
                    description: acc.description || ''
                })
            } catch (err) {
                console.log("Failed to fetch GL account details", err);
            }
        }
        fetchGlAccounts();
    }, [id])

    //gets the data for the template (ie. dropdowns)
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await glApi.retrieveNewAccountDetails();
                setTemplate(response.data);
            } catch (err) {
                console.log("Failed to get gl Template", err);
            }
        };
        fetchTemplate();
    }, []);

    //to fill in the account type and account usage dropdowns
    useEffect(() => {
        if (template && formData.type) {
            setSelectedAccountType(formData.type);
            setSelectedAccountUsage(formData.usage);
            handleAccountTypeChange(formData.type);
        }
    }, [template, formData.type, formData.usage]);

    const handleAccountTypeChange = (value: string) => {
        const id = parseInt(value);

        switch (id) {
            case 1:
                setParentOptions(template?.assetHeaderAccountOptions || []);
                setTagOptions(template?.allowedAssetsTagOptions || []);
                break;
            case 2:
                setParentOptions(template?.liabilityHeaderAccountOptions || []);
                setTagOptions(template?.allowedLiabilitiesTagOptions || []);
                break;
            case 3:
                setParentOptions(template?.equityHeaderAccountOptions || []);
                setTagOptions(template?.allowedEquityTagOptions || []);
                break;
            case 4:
                // setParentOptions(template?.incomeHeaderAccountOptions || []);
                setTagOptions(template?.allowedIncomeTagOptions || []);
                break;
            case 5:
                setParentOptions(template?.expenseHeaderAccountOptions || []);
                setTagOptions(template?.allowedExpensesTagOptions || []);
                break;
            default:
                setParentOptions([]);
                setTagOptions([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.glCode) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            await glApi.updateGLAccount1(Number(id), {
                name: formData.name,
                glCode: formData.glCode,
                type: parseInt(formData.type),
                usage: parseInt(formData.usage),
                manualEntriesAllowed: formData.manualEntriesAllowed,
                description: formData.description,
                parentId: formData.parentId ? Number(formData.parentId) : undefined,
                tagId: formData.tagId ? Number(formData.tagId) : undefined
            })
            alert("GL Account updated successfully!");
            navigate("/accounting/chart-of-accounts");
        } catch (err) {
            console.log("Error in updating GL account", err);
            alert("Failed to update GL account.");
        }
    };

    return (
        <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
            {/* Breadcrumbs */}

            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Accounting", href:"/accounting" },
                    { label: "Chart of Accounts", href: "/accounting/chart-of-accounts" },
                    { label: `${formData.name}`, href: `/accounting/chart-of-accounts/gl-accounts/view/${id}` },
                    { label: "Edit GL Account", current: true }
                ]}
            />

            {/* Form */}
            <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6">Edit GL Account</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1 */}
                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Account Type *"
                            selectValue={selectedAccountType}
                            selectOnChange={(value) => {
                                setSelectedAccountType(value);
                                handleAccountTypeChange(value);
                                setFormData(prev => ({ ...prev, type: value }));
                            }}
                            selectPlaceholder="Select type"
                            selectOptions={
                                (template?.accountTypeOptions || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.value!
                                    }))
                            }
                        />
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Account Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter account name"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Account Usage *"
                            selectValue={selectedAccountUsage}
                            selectOnChange={(value) => {
                                setSelectedAccountUsage(value);
                                setFormData(prev => ({ ...prev, usage: value }));
                            }}
                            selectPlaceholder="Select usage"
                            selectOptions={
                                (template?.usageOptions || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.value!
                                    }))
                            }
                        />
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>GL Code *</Label>
                            <Input
                                value={formData.glCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, glCode: e.target.value }))}
                                placeholder="Enter GL Code"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Parent"
                            selectValue={formData.parentId}
                            selectOnChange={(value) => {
                                setFormData(prev => ({ ...prev, parentId: value }))
                            }}
                            selectPlaceholder="Select parent (optional)"
                            selectOptions={
                                (parentOptions || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.name!
                                    }))
                            }
                        />
                        <AppSelect
                            selectLabel="Tag"
                            selectValue={formData.tagId}
                            selectOnChange={(value) => {
                                setFormData(prev => ({ ...prev, tagId: value }))
                            }}
                            selectPlaceholder="Select tag (optional)"
                            selectOptions={
                                (tagOptions || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.name!
                                    }))
                            }
                        />
                    </div>

                    {/* Row 4 */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="manual-entries"
                            checked={formData.manualEntriesAllowed}
                            onCheckedChange={(val) => {
                                const allowed = Boolean(val);
                                setFormData(prev => ({ ...prev, manualEntriesAllowed: allowed }));
                            }}
                        />
                        <Label htmlFor="manual-entries">Manual Entries Allowed</Label>
                    </div>

                    {/* Row 5 */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional description"
                            className="w-full"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => navigate('/accounting/chart-of-accounts')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
                        >Submit</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditGlAccounts