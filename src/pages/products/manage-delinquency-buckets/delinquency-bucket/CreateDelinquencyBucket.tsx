import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppSelect from "@/components/custom/select/AppSelect";

import {
  DelinquencyRangeAndBucketsManagementApi,
  type DelinquencyRangeData,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

// API instance
const api = new DelinquencyRangeAndBucketsManagementApi(getConfiguration());

const CreateDelinquencyBucket = () => {
  const navigate = useNavigate();

  // Form data (bucket name)
  const [formData, setFormData] = useState({ name: "" });

  // Selected range in dropdown
  const [selectedRange, setSelectedRange] = useState("");

  // Ranges added into this bucket
  const [addedRanges, setAddedRanges] = useState<DelinquencyRangeData[]>([]);

  // All ranges fetched from API
  const [ranges, setRanges] = useState<DelinquencyRangeData[]>([]);

  // Fetch delinquency ranges on mount
  useEffect(() => {
    api.getDelinquencyRanges().then((res) => setRanges(res.data || []));
  }, []);

  // Add selected range into addedRanges list
  const handleAddRange = () => {
    const id = parseInt(selectedRange);
    if (!id || addedRanges.some((r) => r.id === id)) return; // prevent duplicates
    const found = ranges.find((r) => r.id === id);
    if (found) setAddedRanges((prev) => [...prev, found]);
    setSelectedRange(""); // reset dropdown
  };

  // Remove a range from addedRanges list
  const handleRemoveRange = (id: number) => {
    setAddedRanges((prev) => prev.filter((r) => r.id !== id));
  };

  // Submit bucket creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || addedRanges.length === 0) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      await api.createDelinquencyBucket({
        name: formData.name,
        ranges: addedRanges.map((r) => r.id!).filter((id): id is number => id !== undefined),
      });
      alert("Delinquency bucket created!");
      navigate("/products/delinquency-bucket-configurations/buckets");
    } catch (err) {
      console.error("Failed to create bucket", err);
      alert("Failed to create bucket");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-4xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Products", href: "/products" },
          { label: "Delinquency Buckets", href: "/products/delinquency-bucket-configurations/buckets" },
          { label: "Create", current: true },
        ]}
      />

      {/* Form container */}
      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow p-8">
        <h2 className="text-2xl font-semibold mb-6">Create Delinquency Bucket</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name input */}
          <div>
            <Label>Name*</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
            />
          </div>

          {/* Ranges selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Delinquency Ranges</Label>
              {/* Alert dialog for selecting a range */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="bg-[#1074b9] text-white">+ Add</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Select Range</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AppSelect
                    selectLabel="Delinquency Range"
                    selectValue={selectedRange}
                    selectOnChange={setSelectedRange}
                    selectPlaceholder="Choose a range"
                    selectOptions={ranges.map((r) => ({
                      id: String(r.id),
                      name: `${r.classification} (${r.minimumAgeDays}–${r.maximumAgeDays})`,
                    }))}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-[#1074b9] text-white" onClick={handleAddRange}>
                      Add
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Table of added ranges */}
            {addedRanges.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classification</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addedRanges.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.classification}</TableCell>
                      <TableCell>{r.minimumAgeDays}</TableCell>
                      <TableCell>{r.maximumAgeDays}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveRange(r.id!)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/products/delinquency-bucket-configurations/buckets")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1074b9] hover:bg-[#1074c9] text-white">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDelinquencyBucket;
