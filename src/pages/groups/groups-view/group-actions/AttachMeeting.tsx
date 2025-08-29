import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AttachMeeting = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [startDate, setStartDate] = useState<string>("");
  const [repeats, setRepeats] = useState(false);
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("DAILY");
  const [interval, setInterval] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const canSubmit = Boolean(startDate) && !saving;

  return (
    <div className="min-h-screen px-6 py-8">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "Attach Meeting", current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mt-2 mb-6">Attach Meeting</h1>

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-6 max-w-xl">
        {/* Meeting Start Date */}
        <div className="mb-6">
          <Label htmlFor="meeting-start">Meeting Start Date*</Label>
          <Input
            id="meeting-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Repeats? */}
        <div className="mb-4 flex items-center gap-3">
          <Label htmlFor="repeats" className="cursor-pointer">Repeats?</Label>
          <input
            id="repeats"
            type="checkbox"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
            className="h-4 w-4"
          />
        </div>

        {/* When "Repeats?" checked, show Frequency + Interval selects */}
        {repeats && (
          <div className="space-y-5 mb-6">
            <div>
              <Label>Repetition Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(val) =>
                  setFrequency(val as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY")
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">DAILY</SelectItem>
                  <SelectItem value="WEEKLY">WEEKLY</SelectItem>
                  <SelectItem value="MONTHLY">MONTHLY</SelectItem>
                  <SelectItem value="YEARLY">YEARLY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Repetition Interval</Label>
              <Select
                value={String(interval)}
                onValueChange={(v) => setInterval(parseInt(v, 10))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const val = i + 1;
                    return (
                      <SelectItem key={val} value={String(val)}>
                        {val}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate(`/groups/${id}/general`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            // onClick={onSubmit}
            disabled={!canSubmit}
          >
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttachMeeting;
