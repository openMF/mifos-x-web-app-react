import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppSelect from "@/components/custom/select/AppSelect";

const SavingsProductCurrencyStep = ({
  formData,
  setFormData,
  currencyOptions,
}: {
  formData: any;
  setFormData: (val: any) => void;
  currencyOptions: { id: string; name: string; decimalPlaces: number }[];
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Currency"
            selectValue={formData.currency?.id}
            selectOnChange={(code) => {
              const selected = currencyOptions.find((c) => c.id === code);
              if (selected) {
                setFormData((prev: any) => ({
                  ...prev,
                  currency: selected,
                  decimalPlaces: selected.decimalPlaces,
                }));
              }
            }}
            selectPlaceholder="Select Currency"
            selectOptions={currencyOptions}
            selectClassname="w-full space-y-2"
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label>Decimal Places*</Label>
          <Input
            type="number"
            value={formData.decimalPlaces}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                decimalPlaces: +e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <Label>Currency in multiples of</Label>
        <Input
          type="number"
          placeholder="Currency in multiples of"
          value={formData.currencyMultiples}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              currencyMultiples: e.target.value,
            }))
          }
        />
      </div>
    </div>
  );
};

export default SavingsProductCurrencyStep;
