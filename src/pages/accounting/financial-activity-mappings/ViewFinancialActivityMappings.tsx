import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

import { getConfiguration } from "@/lib/fineract-openapi";
import {
  MappingFinancialActivitiesToAccountsApi,
  type GetFinancialActivityAccountsResponse,
} from "@/fineract-api";

// API client
const activityApi = new MappingFinancialActivitiesToAccountsApi(getConfiguration());

const ViewFinancialActivityMappings = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Loaded mapping record
  const [mapping, setMapping] = useState<GetFinancialActivityAccountsResponse>();

  // Fetch mapping by id
  useEffect(() => {

    const fetchMapping = async () => {
      try {
        const response = await activityApi.retreive(Number(id));
        setMapping(response.data);
      } catch (err) {
        console.error("Failed to fetch financial activity mapping", err);
      }
    };

    fetchMapping();
  }, [id]);

  // Delete mapping then go back
  const handleDelete = async () => {

    try {
      await activityApi.deleteGLAccount(Number(id));
      navigate("/accounting/financial-activity-mappings");
    } catch (err) {
      console.log("Failed to delete mappings", err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Accounting" },
          { label: "Financial Activity Mappings", href: "/accounting/financial-activity-mappings" },
          { label: `${mapping?.id}`, current: true },
        ]}
      />

      {/* Details card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* Actions */}
        <div className="flex mb-6 gap-3">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() =>
              navigate(`/accounting/financial-activity-mappings/${mapping?.id}/edit`)
            }
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete
          </Button>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Financial Activity Mapping
        </h2>

        {/* Key/value grid */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Financial Activity</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            ({mapping?.financialActivityData?.id}) {mapping?.financialActivityData?.name}
          </div>

          <div className="font-medium">Account Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">{mapping?.financialActivityData?.mappedGLAccountType}</div>

          <div className="font-medium">Account Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            ({mapping?.glAccountData?.glCode}) {mapping?.glAccountData?.name}
          </div>
        </div>

        {/* Back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate("/accounting/financial-activity-mappings")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewFinancialActivityMappings;
