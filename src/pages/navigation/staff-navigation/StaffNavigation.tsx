import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCircle } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { StaffApi, type StaffData } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

interface StaffNavigationProps {
  staffId: number;
}
const staffApi = new StaffApi(getConfiguration());

const StaffNavigation = ({ staffId }: StaffNavigationProps) => {
  const [staff, setStaff] = useState<StaffData | null>(null);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const res = await staffApi.retrieveOne8(staffId);
        setStaff(res.data);
      } catch (err) {
        console.error("Failed to fetch staff details", err);
      }
    };

    if (staffId) fetchStaffDetails();
  }, [staffId]);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));

  if (!staff) return <p className="text-gray-500">Loading staff details...</p>;

  const dummyCenterCount = 3; 

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <FontAwesomeIcon icon={faUser} size="2x" className="text-gray-700 dark:text-gray-200" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {staff.displayName}
            <FontAwesomeIcon
              icon={faCircle}
              className={staff.isActive ? "text-green-500" : "text-red-500"}
              title={staff.isActive ? "Active" : "Inactive"}
            />
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Associated Office: {staff.officeName}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-700 dark:text-gray-300">
        <div className="font-medium">Joined On:</div>
        <div>{formatDate(staff.joiningDate ?? "")}</div>

        <div className="font-medium">Loan Officer:</div>
        <div>{staff.isLoanOfficer ? "Yes" : "No"}</div>

        <div className="font-medium">Mobile Number:</div>
        <div>{staff.mobileNo}</div>

        <div className="font-medium">Number of Centers:</div>
        <div>{dummyCenterCount}</div>
      </div>
    </div>
  );
};

export default StaffNavigation;
