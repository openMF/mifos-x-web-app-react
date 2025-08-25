import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const LoanProductTermsStep = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <Label className="text-md font-semibold">Principal</Label>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                        <Label>Minimum</Label>
                        <Input type="number" />
                    </div>

                    <div className="flex-1 space-y-2">
                        <Label>Default*</Label>
                        <Input type="number" />
                    </div>

                    <div className="flex-1 space-y-2">
                        <Label>Maximum</Label>
                        <Input type="number" />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex">
                        <Checkbox className="mr-4" />
                        <Label className="text-sm">Allow approval / disbursal above loan applied amount</Label>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex-1 space-y-2 w-[50%]">
                        <Label>Installment day calculation from </Label>
                        <Input />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Label className="text-md font-semibold">Number of repayments</Label>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <Label>Minimum</Label>
                            <Input type="number" />
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label>Default*</Label>
                            <Input type="number" />
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label>Maximum</Label>
                            <Input type="number" />
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                    <div className="flex">
                        <Checkbox className="mr-4" />
                        <Label className="text-sm">Is interest recognition on disbursement date?</Label>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Label className="text-md font-semibold">Interest Rates</Label>

                    <div className="flex">
                        <Checkbox className="mr-4" />
                        <Label className="text-sm">Is Zero Interest Rate?</Label>
                    </div>

                    <div className="flex">
                        <Checkbox className="mr-4" />
                        <Label className="text-sm"> Is Linked to floating interest rates?</Label>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Label className="text-md font-semibold">Nominal interest rate</Label>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <Label>Minimum</Label>
                            <Input type="number" />
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label>Default*</Label>
                            <Input type="number" />
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label>Maximum</Label>
                            <Input type="number" />
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label>Frequency*</Label>
                            <Input type="number" />
                        </div>
                    </div>
                </div>
            </div>

            <Separator />


            <div className="flex flex-col gap-4">

                <Label className="text-md font-semibold">Variations</Label>
                <div className="flex">
                    <Checkbox className="mr-4" />
                    <Label className="text-sm">Terms vary based on loan cycle</Label>
                </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
                <Label className="text-md font-semibold">Repaid every</Label>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                        <Label>Frequency*</Label>
                        <Input type="number" />
                    </div>

                    <div className="flex-1 space-y-2">
                        <Label>Frequency Type*</Label>
                        <Input type="number" />
                    </div>

                    <div className="flex-1 space-y-2">
                        <Label>Minimum days between disbursal and first repayment date</Label>
                        <Input type="number" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoanProductTermsStep
