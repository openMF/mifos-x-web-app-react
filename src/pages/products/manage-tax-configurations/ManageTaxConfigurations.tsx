import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { useNavigate } from "react-router-dom";

const ManageTaxConfigurations = () => {
  const navigate = useNavigate();

  // helper to navigate to tax config sub-pages
  const handleClick = (path: string) => {
    navigate(`/products/tax-configurations/${path}`);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Products", href: "/products" },
          { label: "Manage Tax Configurations", current: true },
        ]}
      />

      {/* Main card container */}
      <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
        {/* Two clickable rows for navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 ">
          {/* Navigate to Tax Components */}
          <div
            className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
            onClick={() => handleClick("tax-components")}
          >
            Manage Tax Components
          </div>

          {/* Navigate to Tax Groups */}
          <div
            className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
            onClick={() => handleClick("tax-groups")}
          >
            Manage Tax Groups
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTaxConfigurations;
