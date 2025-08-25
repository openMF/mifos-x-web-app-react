import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import {
  faBriefcase,
  faMoneyBill,
  faCog,
  faShuffle,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

// menu items (label + route)
const productItems = [
  { icon: faBriefcase, name: "Loan Products", path: "/products/loan-products" },
  { icon: faShuffle, name: "Products Mix", path: "/products/products-mix" },
  { icon: faBriefcase, name: "Savings Products", path: "/products/saving-products" },
  { icon: faBriefcase, name: "Fixed Deposit Products", path: "/products/fixed-deposit-products" },
  { icon: faBriefcase, name: "Share Products", path: "/products/share-products" },
  { icon: faBriefcase, name: "Recurring Deposit Products", path: "/products/recurring-deposit-products" },
  { icon: faMoneyBill, name: "Charges", path: "/products/charges" },
  { icon: faCog, name: "Manage Tax Configurations", path: "/products/tax-configurations" },
  { icon: faMoneyBill, name: "Collateral Management", path: "/products/collaterals" },
  { icon: faBriefcase, name: "Floating Rates", path: "/products/floating-rates" },
  { icon: faBriefcase, name: "Delinquency Bucket", path: "/products/delinquency-bucket-configurations" },
];

const Products = () => {
  const navigate = useNavigate();

  // push to selected route
  const handleClick = (path: string) => navigate(path);

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Products", current: true },
        ]}
      />

      {/* grid of product links */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {productItems.map((option) => (
            <div
              key={option.name}
              onClick={() => handleClick(option.path)}
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <FontAwesomeIcon icon={option.icon} className="text-zinc-700 dark:text-zinc-300 w-4 h-4" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{option.name}</span>
              </div>
              <FontAwesomeIcon icon={faArrowDown} className="text-zinc-500 dark:text-zinc-300 w-3 h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
