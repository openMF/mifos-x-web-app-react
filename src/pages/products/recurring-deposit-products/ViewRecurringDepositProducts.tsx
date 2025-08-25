import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { getConfiguration } from "@/lib/fineract-openapi";
import {
    RecurringDepositProductApi,
    type GetRecurringDepositProductsProductIdResponse,
} from "@/fineract-api";
import { Separator } from "@radix-ui/react-separator";

// Initialize API client
const rdApi = new RecurringDepositProductApi(getConfiguration());

const ViewRecurringDepositProducts = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // get product id from URL
    const [recurrProduct, setRecurrProduct] = useState<GetRecurringDepositProductsProductIdResponse>();

    useEffect(() => {
        // Fetch Recurring Deposit Product details on mount
        const fetch = async () => {
            try {
                const res = await rdApi.retrieveOne23(Number(id));
                console.log(res.data);
                setRecurrProduct(res.data);
            } catch (err) {
                console.error("Failed to fetch recurring deposit product", err);
            }
        };
        fetch();
    }, [id]);

    return (
         <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
            {/* Breadcrumbs for navigation */}
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Products", href: "/products" },
                    { label: "Recurring Deposit Products", href: "/products/recurring-deposit" },
                    { label: recurrProduct?.name ?? "View", current: true },
                ]}
            />

            {/* Main card */}
            <div className="bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">

                {/* Section: Details */}
                <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Details</h2>
                <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Short Name:</div>
                    <div>{recurrProduct?.shortName ?? "—"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Description:</div>
                    <div>{recurrProduct?.description ?? "—"}</div>
                </div>
                <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

                {/* Section: Currency */}
                <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Currency</h2>
                <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Currency:</div>
                    <div>{recurrProduct?.currency?.name ?? "—"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Decimal Places:</div>
                    <div>{recurrProduct?.currency?.decimalPlaces ?? "—"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Currency in multiples of:</div>
                    <div>{" "}</div>
                </div>
                <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

                {/* Section: Terms */}
                <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Terms</h2>
                <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Deposit Amount:</div>
                    <div>{recurrProduct?.maxDepositTerm}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Interest Compounding Period:</div>
                    <div>{recurrProduct?.interestCompoundingPeriodType?.code ?? "—"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Interest Posting Period:</div>
                    <div>{recurrProduct?.interestPostingPeriodType?.code ?? "—"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Interest Calculated using:</div>
                    <div>{recurrProduct?.interestCalculationType?.code ?? "—"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Days in Year:</div>
                    <div>{recurrProduct?.interestCalculationDaysInYearType?.code ?? "—"}</div>
                </div>
                <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

                {/* Section: Settings */}
                <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Settings</h2>
                <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Minimum Deposit Term:</div>
                    <div>{recurrProduct?.minDepositTerm}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Recurring Deposit Type:</div>
                    <div>{"Voluntary"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Withhold Tax is Applicable:</div>
                    <div>{"Missing in OpenApi"}</div>
                </div>
                <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

                {/* Section: Interest Rate Charts */}
                <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Interest Rate Charts</h2>
                <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Name:</div>
                    <div>{"Missing in OpenApi"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Valid from Date:</div>
                    <div>{recurrProduct?.activeChart?.fromDate}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">End Date:</div>
                    <div>{"Missing in OpenApi"}</div>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Primary Grouping by Amount:</div>
                    <div>{"Missing in OpenApi"}</div>
                </div>
                <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

                {/* Section: Accounting */}
                <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Accounting</h2>
                <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
                    <div className="font-medium text-zinc-500 dark:text-zinc-400">Type:</div>
                    <div>{"Missing in OpenApi"}</div>
                </div>
            </div>
        </div>
    );
};

export default ViewRecurringDepositProducts;
