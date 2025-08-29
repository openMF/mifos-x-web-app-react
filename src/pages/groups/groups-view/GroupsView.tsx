import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import Dropdown from "@/components/custom/navbar/Dropdown";
import AppTabs from "@/components/custom/tabs/AppTabs";
import { GroupsApi, type GetGroupsGroupIdResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { faCircle, faPeopleGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";

const groupsApi = new GroupsApi(getConfiguration());

// TODO: wire this to your real auth/perm source
const granted = new Set<string>([
  "UPDATE_GROUP",
  "ASSOCIATECLIENTS_GROUP",
  "TRANSFERCLIENTS_GROUP",
  "CREATE_LOAN",
  "CREATE_SAVINGSACCOUNT",
  "CREATE_GSIMACCOUNT",
  "SAVEORUPDATEATTENDANCE_MEETING",
  "ASSIGNSTAFF_GROUP",
  "UNASSIGNSTAFF_GROUP",
  "CREATE_MEETING",
  "CLOSE_GROUP",
  "DELETE_GROUP",
]);
const hasPerm = (p: string) => granted.has(p);

// status color helper
const statusColor = (v?: string) =>
  ({ Active: "text-green-400", Pending: "text-yellow-400", Inactive: "text-orange-400", Closed: "text-zinc-400" } as const)[v ?? ""] ?? "text-zinc-400";

const GroupsView = () => {
  const { id } = useParams();
  const [group, setGroup] = useState<GetGroupsGroupIdResponse>();

  useEffect(() => {
    (async () => {
      try {
        // bring all associations so we can gate menu items
        const res = await groupsApi.retrieveOne15(Number(id), undefined, undefined, {
          params: { associations: "all" },
        });
        setGroup(res.data);
      } catch (err) {
        console.error("Failed to fetch group", err);
      }
    })();
  }, [id]);

  const isActive =
    (group as any)?.status?.value === "Active" || Boolean((group as any)?.active);
  const hasMembers = Array.isArray((group as any)?.clientMembers) && (group as any).clientMembers.length > 0;
  const hasCalendar = Boolean((group as any)?.collectionMeetingCalendar);
  const hasStaff = Boolean((group as any)?.staffId);
  const inCenter = Boolean((group as any)?.centerId);

  const menuOptions = useMemo(() => {
    const opts: any[] = [];

    if (!isActive && hasPerm("UPDATE_GROUP")) {
      opts.push({ label: "Activate", path: `groups/${group?.id}/actions/activate` });
    }
    if (hasPerm("UPDATE_GROUP")) {
      opts.push({ label: "Edit", path: `groups/${group?.id}/edit` });
    }
    if (hasPerm("ASSOCIATECLIENTS_GROUP")) {
      opts.push({ label: "Transfer Clients", path: `groups/${group?.id}/actions/transfer-clients` });
    }
    if (hasPerm("TRANSFERCLIENTS_GROUP")) {
      opts.push({ label: "Manage Members", path: `groups/${group?.id}/actions/manage-members` });
    }

    if (isActive) {
      const apps: any[] = [];
      if (hasMembers && hasPerm("CREATE_LOAN")) {
        apps.push({ label: "Bulk JLG Loan Application", path: `groups/${group?.id}/loans-accounts/jlg-bulk-create` });
      }
      if (hasPerm("CREATE_SAVINGSACCOUNT")) {
        apps.push({ label: "Group Saving Application", path: `groups/${group?.id}/savings-accounts/create` });
      }
      if (hasPerm("CREATE_LOAN")) {
        apps.push({ label: "Group Loan Application", path: `groups/${group?.id}/loans-accounts/create` });
      }
      if (hasMembers && hasPerm("CREATE_LOAN")) {
        apps.push({ label: "GLIM Application", path: `groups/${group?.id}/loans-accounts/glim-account/create` });
      }
      if (hasMembers && hasPerm("CREATE_GSIMACCOUNT")) {
        apps.push({ label: "GSIM Application", path: `groups/${group?.id}/savings-accounts/gsim-account/create` });
      }
      if (apps.length) {
        opts.push({ label: "Applications", children: apps });
      }
    }

    const more: any[] = [];
    if (hasCalendar && hasPerm("SAVEORUPDATEATTENDANCE_MEETING")) {
      more.push({ label: "Attendance", path: `groups/${group?.id}/actions/attendance` });
    }
    if (!hasStaff && hasPerm("ASSIGNSTAFF_GROUP")) {
      more.push({ label: "Assign Staff", path: `groups/${group?.id}/actions/assign-staff` });
    }
    if (hasStaff && hasPerm("UNASSIGNSTAFF_GROUP")) {
      more.push({ label: "Unassign Staff", path: `groups/${group?.id}/actions/unassign-staff` });
    }
    if (!inCenter && !hasCalendar && isActive && hasPerm("CREATE_MEETING")) {
      more.push({ label: "Attach Meeting", path: `groups/${group?.id}/actions/attach-meeting` });
    }
    if (hasPerm("CLOSE_GROUP")) {
      more.push({ label: "Close", path: `groups/${group?.id}/actions/close` });
    }
    if (hasPerm("DELETE_GROUP")) {
      more.push({
        label: "Delete",
        onClick: () => {
          if (confirm("Are you sure you want to delete this group?")) {
            // wire your delete call here
          }
        },
      });
    }
    if (more.length) {
      opts.push({ label: "More", children: more });
    }

    return opts;
  }, [group, isActive, hasMembers, hasCalendar, hasStaff, inCenter]);

  // status value for tooltip + color
  const statusVal = (group as any)?.status?.value as string | undefined;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: `${group?.name ?? ""}`, href: `/groups/${group?.id}/general` },
          { label: "General", current: true },
        ]}
      />

      <div className="bg-[#0e77b7] text-white p-6 mt-6 rounded-t-lg flex justify-between items-start relative">
        <div className="space-y-2">
          {/* ICON COLOR: white on blue header */}
          <FontAwesomeIcon icon={faPeopleGroup} className="text-white w-10 h-10" />

          <div className="text-xl font-semibold flex items-center gap-2">
            {/* STATUS DOT: dynamic color + tooltip */}
            <FontAwesomeIcon
              icon={faCircle}
              title={statusVal || "Unknown"}
              className={`w-3 h-3 ${statusColor(statusVal)}`}
            />
            <span>Group Name</span>
          </div>
          <div>Group: {"Missing in OpenApi"}</div>
          <div>Center Name: {group?.name}</div>
          <div>Staff: {(group as any)?.staffName ?? "Missing in OpenApi"}</div>
          <div>Activation Date : {(group as any)?.timeline?.activationDate ?? "Missing in OpenApi"}</div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex justify-end">
            <Dropdown
              name={<span className="flex items-center gap-2"><Menu /></span>}
              options={menuOptions}
            />
          </div>

          <div className="mt-30 bg-[#0662a3] px-4 py-2 rounded-md text-sm font-medium text-white">
            <div>Next Meeting on: </div>
            <div>Meeting Frequency: </div>
          </div>
        </div>
      </div>

      <AppTabs
        tabs={[
          { label: "General", href: `groups/${group?.id}/general` },
          { label: "Notes", href: `groups/${group?.id}/notes` },
          { label: "Committee", href: `groups/${group?.id}/committee` },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-b-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
};

export default GroupsView;
