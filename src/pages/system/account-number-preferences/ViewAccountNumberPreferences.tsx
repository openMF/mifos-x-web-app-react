import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
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

import {
  AccountNumberFormatApi,
  type GetAccountNumberFormatsIdResponse,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const accountNumberApi = new AccountNumberFormatApi(getConfiguration());

const ViewAccountNumberPreferences = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [accountPref, setAccountPref] =
    useState<GetAccountNumberFormatsIdResponse | null>(null);

  // Fetch details for selected account number preference
  useEffect(() => {
    const fetchAccountNumberPreference = async () => {
      try {
        const res = await accountNumberApi.retrieveOne(Number(id));
        setAccountPref(res.data);
      } catch (err) {
        console.error("Failed to fetch account preference details", err);
      }
    };

    fetchAccountNumberPreference();
  }, [id]);

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "System" },
          {
            label: "Account Number Preferences",
            href: "/system/account-number-preferences/",
          },
          { label: `${accountPref?.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* Action buttons */}
        <div className="flex justify-between mb-6">
          <div className="flex gap-4">
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              onClick={() =>
                navigate(
                  `/account-number-preferences/${accountPref?.id}/edit`
                )
              }
            >
              <FontAwesomeIcon icon={faPenToSquare} /> Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this account number
                    preference?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Account Number Preference Details
        </h2>

        {/* Details */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Account Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {accountPref?.accountType?.value}
          </div>

          <div className="font-medium">Prefix Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {accountPref?.prefixType?.value}
          </div>
        </div>

        {/* Back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate("/system/account-number-preferences/")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewAccountNumberPreferences;
