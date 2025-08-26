import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { getConfiguration } from "@/lib/fineract-openapi";
import { DataTablesApi, type GetDataTablesResponse } from "@/fineract-api";

const dataTablesApi = new DataTablesApi(getConfiguration());

const ManageDataTables = () => {
  const navigate = useNavigate();

  const [dataTables, setDataTables] = useState<GetDataTablesResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch data tables on mount
  useEffect(() => {
    const fetchDataTables = async () => {
      try {
        const response = await dataTablesApi.getDatatables();
        setDataTables(response.data || []);
      } catch (err) {
        console.error("Failed to fetch data tables", err);
      }
    };
    fetchDataTables();
  }, []);

  // Filter + pagination
  const filtered = dataTables.filter((d) =>
    d.applicationTableName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setPage(1);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "System", href: "/system" },
          { label: "Manage Data Tables", current: true },
        ]}
      />

      {/* Create Data Table button */}
      <div className="flex gap-4 mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate("/system/data-tables/create")}
        >
          <Plus className="mr-2" /> Create Data Table
        </Button>
      </div>

      {/* Search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search Data Tables..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="max-w-sm h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
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

          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>

      {/* Data Tables list */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>

          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Data Table Name</TableHead>
              <TableHead className="px-6 py-4">Associated With</TableHead>
              <TableHead className="px-6 py-4">Sub Type</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((table) => (
              <TableRow
                key={table.applicationTableName}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                onClick={() => navigate(`/system/data-tables/${table.registeredTableName}`)}
              >
                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                  {table.registeredTableName}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {table.applicationTableName || "—"}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {"Missing in OpenAPI"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ManageDataTables;
