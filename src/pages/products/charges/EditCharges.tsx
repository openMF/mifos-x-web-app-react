import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { ChargesApi, type ChargeData } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

// API instance
const chargesApi = new ChargesApi(getConfiguration());

const EditCharges = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Template options
    const [template, setTemplate] = useState<ChargeData>();

    // Form state
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        currency: "USD",
        chargeAppliesTo: "1",
        chargeTimeType: "",
        chargeCalculation: "",
        chargePaymentMode: "",
        amount: "",
        taxGroup: "",
        active: true,
        isPenalty: false,
    });

    // Fetch existing charge details to populate form
    useEffect(() => {
        const fetchCharge = async () => {
            try {
                const response = await chargesApi.retrieveCharge(Number(id));
                const data = response.data;

                setFormData({
                    id: data.id?.toString() ?? "",
                    name: data.name ?? "",
                    currency: data.currency?.code ?? "USD",
                    chargeAppliesTo: data.chargeAppliesTo?.id?.toString() ?? "1",
                    chargeTimeType: data.chargeTimeType?.id?.toString() ?? "",
                    chargeCalculation: data.chargeCalculationType?.id?.toString() ?? "",
                    chargePaymentMode: data.chargePaymentMode?.id?.toString() ?? "",
                    amount: data.amount?.toString() ?? "",
                    taxGroup: "",
                    active: !!data.active,
                    isPenalty: data.penalty ?? false,
                });
            } catch (err) {
                console.log("Failed to fetch charge details", err);
            }
        };

        fetchCharge();
    }, [id]);

    // Fetch charge template
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await chargesApi.retrieveCharge(Number(id), {
                    params: { template: true },
                });
                setTemplate(response.data);
            } catch (err) {
                console.log("Failed to fetch template", err);
            }
        };

        fetchTemplate();
    }, [id]);

    // Submit form , Update charge
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (
            !formData.name ||
            !formData.currency ||
            !formData.chargeCalculation ||
            !formData.chargeTimeType ||
            !formData.amount ||
            !formData.chargeAppliesTo
        ) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            // Build API payload
            const payload: any = {
                name: formData.name,
                amount: Number(formData.amount),
                currencyCode: formData.currency,
                chargeTimeType: Number(formData.chargeTimeType),
                chargeCalculationType: Number(formData.chargeCalculation),
                chargeAppliesTo: Number(formData.chargeAppliesTo),
                active: formData.active,
                penalty: formData.isPenalty,
                locale: "en",
            };

            if (
                formData.chargeAppliesTo === "1" &&
                template?.chargePaymetModeOptions?.length
            ) {
                payload.chargePaymentMode = Number(formData.chargePaymentMode);
            }

            // Call update API
            await chargesApi.updateCharge(Number(id), payload);

            alert("Charges updated successfully!");
            navigate("/products/charges");
        } catch (err) {
            console.log("Couldn't edit charge", err);
            alert("Failed to update Charges.");
        }
    };

    return (
        <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
            {/* Breadcrumbs */}
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Products", href: "/products" },
                    { label: "Charges", href: "/products/charges" },
                    { label: `${formData.id}`, href: `/products/charges/${formData.id}` },
                    { label: "Edit", current: true },
                ]}
            />

            <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6">Edit Charge</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    
                    {/*Name & Currency */}
                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="Enter charge name"
                                className="w-full"
                            />
                        </div>
                        <AppSelect
                            selectLabel="Currency *"
                            selectValue={formData.currency}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, currency: value }))
                            }
                            selectPlaceholder="Select currency"
                            selectOptions={
                                (template?.currencyOptions || []).map((option) => ({
                                    id: option.code!,
                                    name: option.name ?? "",
                                }))
                            }
                        />
                    </div>

                    {/*Applies To & Time Type */}
                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Charge Applies To *"
                            selectValue={formData.chargeAppliesTo}
                            selectOnChange={() => { }}
                            selectPlaceholder="Select entity"
                            selectOptions={
                                (template?.chargeAppliesToOptions || []).map((option) => ({
                                    id: option.id!.toString(),
                                    name: option.value ?? "",
                                }))
                            }
                        />
                        <AppSelect
                            selectLabel="Charge Time Type *"
                            selectValue={formData.chargeTimeType}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, chargeTimeType: value }))
                            }
                            selectPlaceholder="Select time type"
                            selectOptions={
                                (template?.loanChargeTimeTypeOptions || []).map((option) => ({
                                    id: option.id!.toString(),
                                    name: option.value ?? "",
                                }))
                            }
                        />
                    </div>

                    {/*Payment Mode & Calculation */}
                    <div className="flex flex-wrap gap-6">
                        {formData.chargeAppliesTo === "1" && template?.chargePaymetModeOptions?.length ? (
                            <AppSelect
                                selectLabel="Charge Payment Mode *"
                                selectValue={formData.chargePaymentMode}
                                selectOnChange={(value) =>
                                    setFormData((prev) => ({ ...prev, chargePaymentMode: value }))
                                }
                                selectPlaceholder="Select payment mode"
                                selectOptions={
                                    template.chargePaymetModeOptions!.map((option) => ({
                                        id: option.id!.toString(),
                                        name: option.value ?? "",
                                    }))
                                }
                            />
                        ) : null}
                        <AppSelect
                            selectLabel="Charge Calculation *"
                            selectValue={formData.chargeCalculation}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, chargeCalculation: value }))
                            }
                            selectPlaceholder="Select calculation"
                            selectOptions={
                                (template?.chargeCalculationTypeOptions || []).map((option) => ({
                                    id: option.id!.toString(),
                                    name: option.value ?? "",
                                }))
                            }
                        />
                    </div>

                    {/*Amount & Tax Group */}
                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Amount *</Label>
                            <Input
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                                }
                                placeholder="Enter amount"
                                className="w-full"
                            />
                        </div>
                        <AppSelect
                            selectLabel="Tax Group"
                            selectValue={formData.taxGroup}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, taxGroup: value }))
                            }
                            selectPlaceholder="Select tax group"
                            selectOptions={[]}
                        />
                    </div>

                    {/*Active & Penalty flags */}
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={formData.active}
                                onCheckedChange={(val) =>
                                    setFormData((prev) => ({ ...prev, active: !!val }))
                                }
                            />
                            <Label>Active</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={formData.isPenalty}
                                onCheckedChange={(val) =>
                                    setFormData((prev) => ({ ...prev, isPenalty: !!val }))
                                }
                            />
                            <Label>Is Penalty</Label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => navigate("/products/charges")}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
                        >
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCharges;
