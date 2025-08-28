import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

import { CentersApi, type GetCentersCenterIdResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Building2, Menu } from "lucide-react";
import AppTabs from "@/components/custom/tabs/AppTabs";
import Dropdown from "@/components/custom/navbar/Dropdown";

// API instance
const centersApi = new CentersApi(getConfiguration());

// Permission checker (stub — replace with real implementation later)
const can = (_perm: string) => true;

const CentersView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State to hold center details
  const [center, setCenter] = useState<GetCentersCenterIdResponse>();

  // Fetch center details on mount
  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const res = await centersApi.retrieveOne14(Number(id));
        setCenter(res.data);
      } catch (err) {
        console.error("Failed to fetch center", err);
      }
    };
    fetchCenter();
  }, [id]);

  // Handle delete action
  const handleDelete = async () => {
    try {
      await centersApi.delete10(Number(id));
      navigate("/centers");
    } catch (err) {
      console.log("Failed to delete center", err);
    }
  };

  // Loading state
  if (!center) return <div className="p-6">Loading...</div>;

  // Map backend status codes to Tailwind colors
  const statusVal = center.status?.code;
  const statusColorMap: Record<string, string> = {
    "groupingStatusType.active": "text-green-400",
    "groupingStatusType.pending": "text-yellow-400",
    "groupingStatusType.inactive": "text-orange-400",
    "groupingStatusType.closed": "text-zinc-400",
  };
  const statusClass = statusColorMap[statusVal ?? ""] ?? "text-zinc-400";

  // Derived flags
  const isActive = statusVal === "Active";
  const isClosed = statusVal === "Closed";
  const hasCal = !!(center as any)?.collectionMeetingCalendar; // calendar check
  const hasStaff = !!(center as any)?.staffId; // staff check

  // Dropdown menu options
  const menuOptions = [
    // Activate if not active
    ...(!isActive ? [{ label: "Activate", onClick: () => alert("TODO: activate center") }] : []),

    // Edit allowed by permission
    ...(can("UPDATE_CENTER") ? [{ label: "Edit", path: `centers/${center.id}/edit` }] : []),

    // Group-related actions
    { label: "Add Group", path: "groups", disabled: true },
    { label: "Manage Groups", path: "centers" },
    { label: "Centers Saving Application", path: "accounting", disabled: true },

    // Nested "More" options
    {
      label: "More",
      children: [
        // Attendance only if a calendar exists
        ...(hasCal ? [{ label: "Attendance", path: "pdf" }] : []),

        // Assign/unassign staff
        ...(!hasStaff
          ? [{ label: "Assign Staff", path: "email" }]
          : [{ label: "Unassign Staff", path: "email" }]),

        // Delete only if active
        ...(isActive
          ? [
              {
                label: "Delete",
                onClick: () => {
                  if (confirm("Are you sure you want to delete this center?")) {
                    handleDelete();
                  }
                },
              },
            ]
          : []),

        // Always allow closing
        { label: "Close", path: `centers/${center.id}/actions/close` },

        // Attach meeting only if active and no calendar yet
        ...(isActive && !hasCal ? [{ label: "Attach Meeting", path: "meeting" }] : []),

        // Disabled history option (parity with Angular)
        { label: "Staff assignment history", path: "email", disabled: true },
      ],
    },
  ];

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Centers", href: "/centers" },
          { label: String(center.name), href: `/centers/${id}` },
          { label: "General", current: true },
        ]}
      />

      {/* Header card with blue background */}
      <div className="bg-[#0e77b7] text-white p-6 mt-6 rounded-t-lg flex justify-between items-start relative">
        <div className="space-y-2">
          {/* Icon */}
          <Building2 className="text-white w-10 h-10" />

          {/* Name + Status */}
          <div className="text-xl font-semibold flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCircle}
              title={statusVal || "Unknown"}
              className={`${statusClass} w-3 h-3`}
            />
            <span>Center Name : {center.name}</span>
          </div>

          {/* Info fields */}
          <div>Account #: {"Missing in OpenApi"}</div>
          <div>Office: {center.officeName}</div>
          <div>External Id: {"Missing in OpenApi"}</div>
          <div>Activation Date : {"Missing in OpenApi"}</div>
        </div>

        <div className="flex flex-col h-full">
          {/* Dropdown only if not closed */}
          <div className="flex justify-end">
            {!isClosed && (
              <Dropdown
                name={<span className="flex items-center gap-2"><Menu /></span>}
                options={menuOptions}
              />
            )}
          </div>

          {/* Meeting info */}
          <div className="mt-30 bg-[#0662a3] px-4 py-2 rounded-md text-sm font-medium text-white">
            <div>Next Meeting on: {"Missing in OpenAPI"}</div>
            <div>Meeting Frequency: {"Missing in OpenAPI"}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AppTabs
        tabs={[
          { label: "General", href: `centers/${center.id}/general` },
          { label: "Notes", href: `centers/${center.id}/notes` },
        ]}
      />

      {/* Content outlet */}
      <div className="bg-white dark:bg-zinc-800 rounded-b-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
};

export default CentersView;
