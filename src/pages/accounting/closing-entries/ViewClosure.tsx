import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

import { getConfiguration } from "@/lib/fineract-openapi";
import { AccountingClosureApi, type GetGlClosureResponse } from "@/fineract-api";

// API client
const closureApi = new AccountingClosureApi(getConfiguration());

const ViewClosure = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Loaded closure record
  const [closure, setClosure] = useState<GetGlClosureResponse>();

  // Fetch closure 
  useEffect(() => {
    const closureId = Number(id);
    if (!id || isNaN(closureId)) return;

    const fetchClosure = async () => {
      try {
        const response = await closureApi.retreiveClosure(closureId);
        setClosure(response.data);
      } catch (err) {
        console.error("Failed to fetch GL Closure", err);
      }
    };

    fetchClosure();
  }, [id]);

  // Delete handler
  const handleDelete = async () => {
    try {
      await closureApi.deleteGLClosure(Number(id));
      navigate("/accounting/closing-entries");
    } catch (err) {
      console.log("Failed to delete closure", err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Accounting" },
          { label: "Closing Entries", href: "/accounting/closing-entries" },
          { label: `${closure?.id}`, current: true },
        ]}
      />

      {/* Details card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* Actions */}
        <div className="flex mb-6 gap-3">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/accounting/closing-entries/view/${closure?.id}/edit`)}
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
          Manage Closure
        </h2>

        {/* Key/value grid */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Office</div>
          <div className="text-zinc-600 dark:text-zinc-400">{closure?.officeName}</div>

          <div className="font-medium">Closure Date</div>
          <div className="text-zinc-600 dark:text-zinc-400">{closure?.closingDate}</div>

          <div className="font-medium">Closed By</div>
          <div className="text-zinc-600 dark:text-zinc-400">{closure?.createdByUsername}</div>

          <div className="font-medium">Updated By</div>
          <div className="text-zinc-600 dark:text-zinc-400">{closure?.lastUpdatedByUsername}</div>

          <div className="font-medium">Updated On</div>
          <div className="text-zinc-600 dark:text-zinc-400">{closure?.lastUpdatedDate}</div>

          <div className="font-medium">Closure Creation Date</div>
          <div className="text-zinc-600 dark:text-zinc-400">{closure?.createdDate}</div>

          <div className="font-medium">Comments</div>
          <div className="text-zinc-600 dark:text-zinc-400">{closure?.comments || "-"}</div>
        </div>

        {/* Back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate("/accounting/closing-entries")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewClosure;
