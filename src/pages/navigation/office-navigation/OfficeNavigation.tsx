import { OfficesApi, StaffApi, type GetOfficesResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { faBuilding } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

interface OfficeNavigationProps {
    officeId: number;
}

const officeApi = new OfficesApi(getConfiguration());
const staffApi = new StaffApi(getConfiguration());

const OfficeNavigation = ({ officeId }: OfficeNavigationProps) => {
    const [office, setOffice] = useState<GetOfficesResponse | null>(null);
    const [staffCount, setStaffCount] = useState<number>(0);

    useEffect(() => {
        const fetchOfficeDetails = async () => {
            try {
                const officeRes = await officeApi.retrieveOffice(Number(officeId));
                setOffice(officeRes.data);

                const staffCountRes = await staffApi.retrieveAll16(Number(officeId));
                setStaffCount(staffCountRes.data.length);
            } catch (err) {
                console.error("Failed to get Office details", err);
            }
        };

        if (officeId) fetchOfficeDetails();
    }, [officeId]);

    if (!office)
        return <p className="text-gray-500">Loading office details...</p>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-4">
                <FontAwesomeIcon icon={faBuilding} className="text-3xl " />
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {office.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                        External ID: {office.externalId}
                    </p>
                </div>
            </div>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Opened On:</span>
                    <span className="font-medium">
                        {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        }).format(new Date(office.openingDate ?? ""))}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="font-medium">Number of Staff:</span>
                    <span>{staffCount}</span>
                </div>
            </div>
        </div>
    );
};

export default OfficeNavigation;
