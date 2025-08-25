import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoanProductCurrencyStep = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                    <Label>Currency*</Label>
                    <Input/>
                </div>

                <div className="flex-1 space-y-2">
                    <Label>Decimal Places*</Label>
                    <Input type="number"/>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                    <Label>Currency in multiples of</Label>
                    <Input type="number"/>
                </div>

                <div className="flex-1 space-y-2">
                    <Label>Installment in multiples of</Label>
                    <Input type="number"/>
                </div>
            </div>
        </div>
    )
}

export default LoanProductCurrencyStep
