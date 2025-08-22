import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, RotateCcw, NotebookText } from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

type ProvisioningEntry = {
  id: number;
  createdBy?: string;
  createdOn?: string; // ISO date
  journalEntryId?: number | null; // if present => JE created
};

// TODO: replace with real data from API
const SEED: ProvisioningEntry[] = [];

const ProvisioningEntries = () => {
  const navigate = useNavigate();

  const [entries] = useState<ProvisioningEntry[]>(SEED);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = entries.filter((e) =>
    (e.createdBy ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setPage(1);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Accounting", href: "/accounting" },
          { label: "Provisioning Entries", current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate("/accounting/provisioning-entries/create")}
        >
          <Plus className="mr-2" /> Create Provisioning Entry
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Filter by Created By"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="max-w-sm h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[140px] h-11 text-base">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Created By</TableHead>
              <TableHead className="px-6 py-4">Created On</TableHead>
              <TableHead className="px-6 py-4">Journal Entry Created</TableHead>
              <TableHead className="px-6 py-4">View Report</TableHead>
              <TableHead className="px-6 py-4">Recreate Provisioning</TableHead>
              <TableHead className="px-6 py-4">View Journal Entry</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((row) => {
              const createdOn =
                row.createdOn ? new Date(row.createdOn).toLocaleDateString() : "—";
              const jeCreated = row.journalEntryId ? "Yes" : "No";

              return (
                <TableRow key={row.id} className="text-base hover:bg-muted">
                  <TableCell className="px-6 py-4">{row.createdBy ?? "—"}</TableCell>
                  <TableCell className="px-6 py-4">{createdOn}</TableCell>
                  <TableCell className="px-6 py-4">{jeCreated}</TableCell>

                  <TableCell className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/accounting/provisioning-entries/${row.id}/report`)
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/accounting/provisioning-entries/${row.id}/recreate`)
                      }
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Recreate
                    </Button>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    {row.journalEntryId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/accounting/journal-entries/view/${row.journalEntryId}`
                          )
                        }
                      >
                        <NotebookText className="mr-2 h-4 w-4" />
                        View JE
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProvisioningEntries;
