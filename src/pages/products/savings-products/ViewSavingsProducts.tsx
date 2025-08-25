import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { SavingsProductApi, type GetSavingsProductsProductIdResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Separator } from "@radix-ui/react-separator";

const savingsApi = new SavingsProductApi(getConfiguration());

const ViewSavingsProducts = () => {
  const { id } = useParams();
  // Holds the fetched savings product details
  const [savingsProducts, setSavingsProducts] = useState<GetSavingsProductsProductIdResponse>();

  useEffect(() => {
    // Load a single savings product on mount and when :id changes
    const fetchSaving = async () => {
      try {
        const res = await savingsApi.retrieveOne27(Number(id));
        setSavingsProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch savings products", err);
      }
    };
    fetchSaving();
  }, [id]);

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Products", href: "/products" },
          { label: "Loan Products", href: "/products/loan-products" },
          { label: savingsProducts?.name ?? "Loan", current: true },
        ]}
      />

      {/* Content card */}
      <div className="bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
        {/* Details */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Details</h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">Short Name:</div>
          <div>{savingsProducts?.shortName ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Description:</div>
          <div>{savingsProducts?.description ?? "—"}</div>
        </div>

        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Currency */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Currency</h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">Currency:</div>
          <div>{savingsProducts?.currency?.name ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Decimal Places:</div>
          <div>{savingsProducts?.currency?.decimalPlaces ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Currency in multiples of:</div>
          <div>{" "}</div>
        </div>

        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Terms */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Terms</h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">Nominal Annual Interest:</div>
          <div>{savingsProducts?.nominalAnnualInterestRate ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Interest Compounding Period:</div>
          <div>{savingsProducts?.interestCompoundingPeriodType?.value ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Interest Posting Period:</div>
          <div>{savingsProducts?.interestPostingPeriodType?.value ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Interest Calculated using:</div>
          <div>{savingsProducts?.interestCalculationType?.value ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Days in Year:</div>
          <div>{savingsProducts?.interestCalculationDaysInYearType?.value ?? "—"}</div>
        </div>

        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Settings */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Settings</h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">Apply Withdrawal Fee for Transfers:</div>
          <div>{savingsProducts?.withdrawalFeeForTransfers ? "Yes" : "No"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Enforce Minimum Balance:</div>
          <div>{"Missing in OpenApi"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Withhold Tax is Applicable:</div>
          <div>{"Missing in OpenApi"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Is Overdraft Allowed:</div>
          <div>{"Missing in OpenApi"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Enable Dormancy Tracking:</div>
          <div>{"Missing in OpenApi"}</div>
        </div>

        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Accounting */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Accounting</h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">Type:</div>
          <div>{savingsProducts?.accountingRule?.value ?? "—"}</div>
        </div>
      </div>
    </div>
  );
};

export default ViewSavingsProducts;
