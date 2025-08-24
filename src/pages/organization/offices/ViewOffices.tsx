import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { OfficesApi, type GetOfficesResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { format } from "date-fns";

const officesApi = new OfficesApi(getConfiguration());

const ViewOffices = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [office, setOffice] = useState<GetOfficesResponse>();

  // fetch office details
  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const res = await officesApi.retrieveOffice(Number(id));
        setOffice(res.data);
      } catch (err) {
        console.error("Failed to fetch office", err);
      }
    };
    fetchOffice();
  }, [id]);

  if (!office) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Organization", href: "/organization" },
          { label: "Offices", href: "/organization/offices" },
          { label: `${office.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* edit button */}
        <div className="flex max-w-2xl mx-auto mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/organization/offices/${office.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Manage Office
        </h2>

        {/* office details */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Parent Office</div>
          <div>{"missing in openapi"}</div>

          <div className="font-medium">Opened On</div>
          <div>
            {Array.isArray(office.openingDate)
              ? format(
                  new Date(
                    office.openingDate[0],
                    office.openingDate[1] - 1,
                    office.openingDate[2]
                  ),
                  "dd MMMM yyyy"
                )
              : "—"}
          </div>

          <div className="font-medium">Name Decorated</div>
          <div>{office.nameDecorated || "—"}</div>

          <div className="font-medium">External Id</div>
          <div>{office.externalId || "—"}</div>
        </div>

        {/* back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate("/organization/offices")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewOffices;
