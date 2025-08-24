import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import {
  AdhocQueryApiApi,
  type AdHocData,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

const adhocApi = new AdhocQueryApiApi(getConfiguration());

const ViewAdhocQuery = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // route id
  const [query, setQuery] = useState<AdHocData>(); // current record

  useEffect(() => {
    // load record by id
    const fetchQuery = async () => {
      try {
        const res = await adhocApi.retrieveAdHocQuery(Number(id));
        setQuery(res.data);
      } catch (err) {
        console.error("Failed to fetch adhoc query", err);
      }
    };
    fetchQuery();
  }, [id]);

  // delete record then return to list
  const handleDelete = async () => {
    try {
      await adhocApi.deleteAdHocQuery(Number(id));
      navigate("/organization/adhoc-query");
    } catch (err) {
      console.error("Failed to delete adhoc query", err);
    }
  };

  // simple loading guard
  if (!query) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Organization", href: "/organization" },
          { label: "Adhoc Query", href: "/organization/adhoc-query" },
          { label: `${query.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* actions */}
        <div className="flex mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
            onClick={() => navigate(`/organization/adhoc-query/${query.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete Adhoc Query "{query.name}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* details */}
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Adhoc Query Details
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">{query.name || "—"}</div>

          <div className="font-medium">Query</div>
          <div className="text-zinc-600 dark:text-zinc-400">{query.query || "—"}</div>

          <div className="font-medium">Table Affected</div>
          <div className="text-zinc-600 dark:text-zinc-400">{query.tableName || "—"}</div>

          <div className="font-medium">Status</div>
          <div className="text-zinc-600 dark:text-zinc-400">{query.isActive ? "Active" : "Inactive"}</div>

          <div className="font-medium">Created By</div>
          <div className="text-zinc-600 dark:text-zinc-400">{query.createdBy || "—"}</div>
        </div>

        {/* back */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate("/organization/adhoc-queries")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewAdhocQuery;
