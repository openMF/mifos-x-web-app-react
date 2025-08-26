import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

const EntityToEntityMapping = () => {
  const rows = [
    "Offices --> Loan Products",
    "Offices --> Savings Products",
    "Offices --> Charges/Fees",
    "Roles --> Loan Products",
    "Roles --> Savings Products",
  ];

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">

      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "System", href: "/system" },
          { label: "Entity to Entity Mapping", current: true },
        ]}
      />

      <div className="mt-6 bg-white dark:bg-zinc-900 rounded-md border shadow max-w-5xl">
        {/* Header */}
        <div className="px-6 py-4 font-semibold border-b">
          Mapping Between Entities
        </div>

        {/* Rows */}
        <div className="divide-y">
          {rows.map((text, i) => (
            <div
              key={text}
              className={`px-6 py-4 ${
                i % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-800/40" : ""
              }`}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EntityToEntityMapping;
