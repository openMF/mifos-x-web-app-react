import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SavingsProductDetailsStep = ({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (val: any) => void;
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Product Name & Short Name */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="productName">Product Name*</Label>
          <Input
            id="productName"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="shortName">Short Name*</Label>
          <Input
            id="shortName"
            value={formData.shortName}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                shortName: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Row 2: Description */}
      <div className="flex-1 space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              description: e.target.value,
            }))
          }
        />
      </div>
    </div>
  );
};

export default SavingsProductDetailsStep;
