import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SavingsProductAccountingStep = ({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (val: any) => void;
}) => {
  return (
    <div className="space-y-4">
      <RadioGroup
        value={formData.accountingRule}
        onValueChange={(val) =>
          setFormData((prev: any) => ({
            ...prev,
            accountingRule: val,
          }))
        }
        className="flex gap-6"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="none" />
          <Label htmlFor="none">None</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash">Cash</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="accrual" id="accrual" />
          <Label htmlFor="accrual">Accrual (periodic)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default SavingsProductAccountingStep;
