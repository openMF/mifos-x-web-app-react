import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { GroupsApi, type GetGroupsGroupIdResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const groupsApi = new GroupsApi(getConfiguration());

function dateArrayToInputValue(arr?: number[] | null): string {
  if (!arr || arr.length < 3) return "";
  const [y, m, d] = arr;
  return `${y}-${String(m ?? 1).padStart(2, "0")}-${String(d ?? 1,).padStart(2,"0")}`;
}

function inputToFineractDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return undefined;
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  return `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
}

const EditGroups = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Local state for group + form fields
  const [group, setGroup] = useState<GetGroupsGroupIdResponse>();
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState<string>("");
  const [submittedOn, setSubmittedOn] = useState<string>("");
  const [activationOn, setActivationOn] = useState<string>("");
  const [externalId, setExternalId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Fetch group details on load
  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await groupsApi.retrieveOne15(Number(id));
        setGroup(res.data);

        setName(res.data?.name ?? "");
        if ((res.data as any)?.staffId) {
          setStaffId(String((res.data as any).staffId));
        }
        setSubmittedOn(
          dateArrayToInputValue((res.data as any)?.timeline?.submittedOnDate)
        );
        setActivationOn(
          dateArrayToInputValue(
            (res.data as any)?.timeline?.activationDate ??
              (res.data as any)?.timeline?.activatedOnDate
          )
        );
        // externalId left blank on purpose, user must fill if needed
      } catch (err) {
        console.error("Can't fetch group", err);
      }
    })();
  }, [id]);

  // Build staff dropdown options from API response
  const staffOptions =
    ((group as any)?.staffOptions ?? []).map((s: any) => ({
      id: s.id,
      name: s.displayName ?? s.name ?? `Staff ${s.id}`,
    })) || [];

  // Handle submit 
  const onSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        locale: "en",
        dateFormat: "dd MMMM yyyy",
      };

      if (staffId) payload.staffId = Number(staffId);
      const sub = inputToFineractDate(submittedOn);
      if (sub) payload.submittedOnDate = sub;
      const act = inputToFineractDate(activationOn);
      if (act) payload.activationDate = act;
      if (externalId.trim()) payload.externalId = externalId.trim();

      navigate(`/groups/${id}/general`);
    } catch (err) {
      console.error("Failed to update group", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumb navigation */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: group?.name ?? "Group", href: `/groups/${id}/general` },
          { label: "Edit", current: true },
        ]}
      />

      {/* Edit form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Group</h2>

        <div className="space-y-6">
          {/* Group name */}
          <div className="w-full space-y-2">
            <Label htmlFor="group-name">Name*</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full"
            />
          </div>

          {/* Staff dropdown or read-only field */}
          {staffOptions.length > 0 ? (
            <AppSelect
              selectLabel="Staff"
              selectValue={staffId}
              selectOnChange={(val: string) => setStaffId(val)}
              selectPlaceholder="Select Staff"
              selectOptions={staffOptions}
              selectClassname="w-full"
            />
          ) : (
            <div className="w-full space-y-2">
              <Label>Staff</Label>
              <Input
                value={
                  (group as any)?.staffName ??
                  (group as any)?.staff?.displayName ??
                  "Unassigned"
                }
                readOnly
                className="w-full"
              />
            </div>
          )}

          {/* Submitted On */}
          <div className="w-full space-y-2">
            <Label htmlFor="submitted-on">Submitted On*</Label>
            <Input
              id="submitted-on"
              type="date"
              value={submittedOn}
              onChange={(e) => setSubmittedOn(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Activation Date */}
          <div className="w-full space-y-2">
            <Label htmlFor="activation-on">Activation Date*</Label>
            <Input
              id="activation-on"
              type="date"
              value={activationOn}
              onChange={(e) => setActivationOn(e.target.value)}
              className="w-full"
            />
          </div>

          {/* External Id */}
          <div className="w-full space-y-2">
            <Label htmlFor="external-id">External id</Label>
            <Input
              id="external-id"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="Enter external id"
              className="w-full"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/groups/${id}/general`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={saving || !name.trim()}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {saving ? "Saving..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGroups;
