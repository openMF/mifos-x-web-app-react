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
  CollateralManagementApi,
  type CollateralManagementData,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

// API instance for Collateral Management
const collateralApi = new CollateralManagementApi(getConfiguration());

const ViewCollaterals = () => {
  const navigate = useNavigate();
  // Get :id from route 
  const { id } = useParams();
  // Holds the fetched collateral details
  const [collateral, setCollateral] = useState<CollateralManagementData>();

  useEffect(() => {
    // Fetch a single collateral by id on mount / id change
    const fetchCollateral = async () => {
      try {
        const res = await collateralApi.getCollateral(Number(id));
        setCollateral(res.data);
      } catch (err) {
        console.error("Failed to fetch collateral", err);
      }
    };
    fetchCollateral();
  }, [id]);

  // Delete handler confirms in dialog, then calls API and navigates back to list
  const handleDelete = async () => {
    try {
      await collateralApi.deleteCollateral2(Number(id));
      navigate("/products/collaterals");
    } catch (err) {
      console.error("Failed to delete collateral", err);
    }
  };

  // Very simple loading guard while data is being fetched
  if (!collateral) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs for navigation context */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Products", href: "/products" },
          { label: "Collaterals", href: "/products/collaterals" },
          { label: `${collateral.id}`, current: true },
        ]}
      />

      {/* Details Card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* Page Actions: Edit + Delete */}
        <div className="flex mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
            onClick={() => navigate(`/products/collaterals/${collateral.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </Button>
            </AlertDialogTrigger>

            {/* Confirmation modal before deleting */}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete collateral {collateral.name}?
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

        {/* Data section */}
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Collateral Details
        </h2>

        {/* Key/value layout for collateral fields */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Collateral Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">{collateral.name}</div>

          <div className="font-medium">Type/Quality</div>
          <div className="text-zinc-600 dark:text-zinc-400">{collateral.quality}</div>

          <div className="font-medium">Base Price</div>
          <div className="text-zinc-600 dark:text-zinc-400">{collateral.basePrice}</div>

          <div className="font-medium">Base Percentage</div>
          <div className="text-zinc-600 dark:text-zinc-400">{collateral.pctToBase}</div>

          <div className="font-medium">Unit Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">{collateral.unitType}</div>

          <div className="font-medium">Currency</div>
          <div className="text-zinc-600 dark:text-zinc-400">{collateral.currency}</div>
        </div>

        {/* Back to list */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28"
            onClick={() => navigate("/products/collaterals")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewCollaterals;
