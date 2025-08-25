import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs"
import { Separator } from "@/components/ui/separator"
import { FloatingRatesApi, type FloatingRateData } from "@/fineract-api"
import { getConfiguration } from "@/lib/fineract-openapi"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

// API instance for floating rates
const floatingRateApi = new FloatingRatesApi(getConfiguration());

const ViewFloatingRates = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // floating rate ID from route params
  const [rates, setRates] = useState<FloatingRateData>();

  // Fetch floating rate details when component mounts or id changes
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await floatingRateApi.retrieveOne13(Number(id)); // API call
        console.log(res.data);
        setRates(res.data);
      } catch (err) {
        console.error("Failed to fetch floating rate", err);
      }
    };
    fetch();
  }, [id]);

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumb navigation */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Products", href: "/products" },
          { label: "Floating Rates", href: "/products/floating-rates" },
          { label: rates?.name ?? "View", current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
        {/* Details section */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">Details</h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">Floating Rate Name:</div>
          <div>{rates?.name ?? "—"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Is Base Lending Rate:</div>
          <div>{rates?.isBaseLendingRate ? "Yes" : "No"}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">Is Active:</div>
          <div>{rates?.isActive ? "Yes" : "No"}</div>
        </div>

        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Floating Rate Periods section placeholder */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Floating Rate Periods
        </h2>
      </div>
    </div>
  );
};

export default ViewFloatingRates;
