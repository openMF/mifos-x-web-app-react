import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const LoanProductChargesStep = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                        <Label>Minimum</Label>
                        <Input type="number" />
                    </div>
                </div>

            </div>

            <Separator />

            <div className="flex flex-col gap-4">
                <Label className="text-md font-semibold">Principal</Label>
                <div className="flex-1 space-y-2">
                    <Label>Overdue Charges</Label>
                    <Input type="number" />
                </div>
            </div>
        </div>

    )
}

export default LoanProductChargesStep
