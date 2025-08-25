import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AppSelect from "@/components/custom/select/AppSelect";

// interface LoanProductDetailProps {
//     fund: string;
//     setFund: (value: string) => void;
//     fundOptions?: { id: number; name: string }[];
// }

const LoanProductDetailsStep = () => {

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                    <Label>Product Name*</Label>
                    <Input />
                </div>

                <div className="flex-1 space-y-2">
                    <Label>External Id</Label>
                    <Input />
                </div>
            </div>

            {/* Row 2: Short Name */}
            <div className="flex-1 space-y-2">
                <Label>Short Name*</Label>
                <Input />
            </div>

            {/* Row 3: Fund + Include Checkbox */}
            <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-2">
                    <Label>Fund</Label>
                    {/* <AppSelect
                        selectLabel="Fund"
                        selectValue={fund}
                        selectPlaceholder="Select Fund"
                        selectOnChange={setFund}
                        selectOptions={fundOptions || []}
                    /> */}
                </div>

                <div className="space-y-2">
                    <div className="flex">
                        <Checkbox className="mr-4" />
                        <Label className="text-sm">Include in Customer Loan Counter</Label>
                    </div>
                </div>
            </div>

            {/* Row 4: Start Date + Close Date */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" />
                </div>

                <div className="flex-1 space-y-2">
                    <Label>Close Date</Label>
                    <Input type="date" />
                </div>
            </div>

            {/* Row 5: Description */}
            <div className="space-y-2">
                <Label>Description</Label>
                <Input />
            </div>
        </div>

    );
};



export default LoanProductDetailsStep;
