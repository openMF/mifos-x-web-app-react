import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

const ViewGuarantors = () => {

  // placeholder values
  const leftRows = [
    { label: "Disbursement Date", value: "" },
    { label: "Currency", value: "" },
    { label: "Loan Officer", value: "" },
    { label: "External Id", value: "" },
  ];

  const rightRows = [
    { label: "Loan Purpose", value: "" },
    { label: "Approved Amount", value: "" },
    { label: "Disburse Amount", value: "" },
    { label: "Arrears By", value: "" },
  ];

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Groups", href: "/groups" },
          { label: "View Guarantors", current: true },
        ]}
      />

      {/* main card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">View Guarantors</h2>

        {/* two-column table layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* left table */}
          <Table className="text-sm border rounded">
            <TableBody>
              {leftRows.map((r) => (
                <TableRow key={r.label} className="border-b last:border-0">
                  <TableCell className="w-1/2 p-3">{r.label}</TableCell>
                  <TableCell className="p-3 bg-muted">{r.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* right table */}
          <Table className="text-sm border rounded">
            <TableBody>
              {rightRows.map((r) => (
                <TableRow key={r.label} className="border-b last:border-0">
                  <TableCell className="w-1/2 p-3">{r.label}</TableCell>
                  <TableCell className="p-3 bg-muted">{r.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ViewGuarantors;
