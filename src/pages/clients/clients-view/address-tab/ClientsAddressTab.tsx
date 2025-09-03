import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const ClientsAddressTab = () => {
  // const { id } = useParams(); 

  // modal open/close
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    addressType: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  useEffect(() => {
    setOpen(false);
  }, []);

  const onChange = (key: keyof typeof form) => (e: any) =>
    setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
  };

  return (
    <div className="bg-transparent">
      {/* header + Add button */}
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Client Address Details
        </h3>

        {/* add address dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none">
              <Plus className="mr-1" /> Add
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Add Client Address</DialogTitle>
            </DialogHeader>

            {/* form body */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* address type */}
              <div className="space-y-2">
                <Label>Address Type</Label>
                <Select
                  value={form.addressType}
                  onValueChange={(v) => setForm((f) => ({ ...f, addressType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME">Home</SelectItem>
                    <SelectItem value="WORK">Work</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* lines 1–3 */}
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input value={form.addressLine1} onChange={onChange("addressLine1")} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input value={form.addressLine2} onChange={onChange("addressLine2")} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 3</Label>
                <Input value={form.addressLine3} onChange={onChange("addressLine3")} />
              </div>

              {/* city */}
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={onChange("city")} />
              </div>

              {/* state/province*/}
              <div className="space-y-2 w-full">
                <Label>State / Province</Label>
                <Select

                >
                  <SelectTrigger>
                    <SelectValue placeholder="State / Province" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                  </SelectContent>
                </Select>
              </div>

              {/* postal code */}
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input value={form.city} onChange={onChange("city")} />
              </div>

              {/* country */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.city} onChange={onChange("city")} />
              </div>

              {/* actions */}
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0e77b7] hover:bg-[#0662a3] text-white">
                  Add
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClientsAddressTab;
