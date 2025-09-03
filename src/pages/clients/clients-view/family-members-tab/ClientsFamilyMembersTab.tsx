import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ClientsFamilyMembersAddTab = ({
  clientId,
  onCancel,
  onSubmitted,
}: {
  clientId?: string;
  onCancel?: () => void;
  onSubmitted?: () => void;
}) => {
  // form state for all input fields
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    qualification: "",
    age: "",
    isDependent: false,
    relationship: "",
    gender: "",
    profession: "",
    maritalStatus: "",
    dob: "",
  });

  // update helper for form fields
  const set = (k: keyof typeof form, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  // basic validation check for required fields
  const isValid =
    form.firstName &&
    form.lastName &&
    form.age &&
    form.relationship &&
    form.gender &&
    form.dob;

  // handle submit
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmitted?.();
  };

  return (
    <form onSubmit={submit} className="p-0">
      {/* grid layout for form inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* Names */}
        <div className="space-y-1">
          <Label>First Name*</Label>
          <Input
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1">
          <Label>Middle Name</Label>
          <Input
            value={form.middleName}
            onChange={(e) => set("middleName", e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1">
          <Label>Last Name*</Label>
          <Input
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1">
          <Label>Qualification</Label>
          <Input
            value={form.qualification}
            onChange={(e) => set("qualification", e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>

        {/* Age + Dependent checkbox */}
        <div className="space-y-1">
          <Label>Age*</Label>
          <Input
            type="number"
            min={0}
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Label className="m-0">Is Dependent?</Label>
          <Checkbox
            checked={form.isDependent}
            onCheckedChange={(v) => set("isDependent", !!v)}
          />
        </div>

        {/* Relationship + Gender */}
        <div className="space-y-1">
          <Label>Relationship*</Label>
          <Select
            value={form.relationship}
            onValueChange={(v) => set("relationship", v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SPOUSE">Spouse</SelectItem>
              <SelectItem value="CHILD">Child</SelectItem>
              <SelectItem value="PARENT">Parent</SelectItem>
              <SelectItem value="SIBLING">Sibling</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Gender*</Label>
          <Select
            value={form.gender}
            onValueChange={(v) => set("gender", v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profession + Marital Status */}
        <div className="space-y-1">
          <Label>Profession</Label>
          <Select
            value={form.profession}
            onValueChange={(v) => set("profession", v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYED">Employed</SelectItem>
              <SelectItem value="SELF_EMPLOYED">Self-Employed</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="UNEMPLOYED">Unemployed</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Marital Status</Label>
          <Select
            value={form.maritalStatus}
            onValueChange={(v) => set("maritalStatus", v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single</SelectItem>
              <SelectItem value="MARRIED">Married</SelectItem>
              <SelectItem value="DIVORCED">Divorced</SelectItem>
              <SelectItem value="WIDOWED">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date of Birth */}
        <div className="space-y-1">
          <Label>Date Of Birth*</Label>
          <div className="relative">
            <Input
              type="date"
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
              className="w-full rounded-none border-0 border-b border-zinc-300 pr-10 focus-visible:ring-0"
            />
            <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center gap-4 justify-center mt-8">
        <Button type="button" variant="outline" onClick={() => onCancel?.()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white"
        >
          Submit
        </Button>
      </div>
    </form>
  );
};

export default ClientsFamilyMembersAddTab;
