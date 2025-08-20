import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faCircle } from "@fortawesome/free-solid-svg-icons";
import { GroupsApi, type GetGroupsGroupIdResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const groupApi = new GroupsApi(getConfiguration());

interface GroupNavigationProps {
  groupId: number;
}

const GroupNavigation = ({ groupId }: GroupNavigationProps) => {
  const [groupDetails, setGroupDetails] = useState<GetGroupsGroupIdResponse | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await groupApi.retrieveOne15(groupId);
        setGroupDetails(res.data);
      } catch (err) {
        console.error("Error fetching group data:", err);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (!groupDetails) {
    return <p className="text-gray-500">Loading group details...</p>;
  }

  const extra = groupDetails as any;

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <FontAwesomeIcon icon={faUsers} size="2x" className="text-gray-700 dark:text-gray-200" />
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {groupDetails.name}
            <FontAwesomeIcon
              icon={faCircle}
              className={
                extra.status?.code === "groupingStatusType.active"
                  ? "text-green-500"
                  : "text-gray-400"
              }
              title={extra.status?.description}
            />
          </h2>
          <p className="text-gray-500">
            Account No: <span className="font-medium">{extra.accountNo || "N/A"}</span> | External ID:{" "}
            <span className="font-medium">{extra.externalId || "N/A"}</span>
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-y-3">
        <div className="font-medium">Activation Date:</div>
        <div>{formatDate(extra.activationDate)}</div>

        <div className="font-medium">Associated Officer:</div>
        <div>{extra.staffName || "N/A"}</div>

        <div className="font-medium">Associated Center:</div>
        <div>{extra.centerName || "N/A"}</div>

        <div className="font-medium">Next Meeting Date:</div>
        <div>{formatDate(extra.nextMeetingDate)}</div>

        <div className="font-medium">Meeting Frequency:</div>
        <div>{extra.meetingFrequency || "N/A"}</div>

        <div className="font-medium">Number of Clients:</div>
        <div>{extra.clientMembers?.length ?? "N/A"}</div>
      </div>
    </div>
  );
};

export default GroupNavigation;

function formatDate(date?: string) {
  if (!date) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "Invalid Date";
  }
}
