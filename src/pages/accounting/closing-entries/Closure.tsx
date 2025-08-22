import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

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
import { getConfiguration } from "@/lib/fineract-openapi";
import { AccountingClosureApi, type GetGlClosureResponse } from "@/fineract-api";

// API client instance
const closureApi = new AccountingClosureApi(getConfiguration());

const Closure = () => {
  const navigate = useNavigate();

  // Data + UI state
  const [closures, setClosures] = useState<GetGlClosureResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Initial fetch on mount
  useEffect(() => {
    const fetchClosures = async () => {
      try {
        const response = await closureApi.retrieveAllClosures();
        setClosures(response.data || []);
      } catch (err) {
        console.error("Failed to fetch closures", err);
      }
    };
    fetchClosures();
  }, []);

  // Text filter by office name
  const filtered = closures.filter((closure) =>
    closure.officeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Items-per-page change resets to page 1
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
          { label: "Accounting", href: "/accounting" },
          { label: "Closing Entries", current: true },
        ]}
      />

      {/* Create Closure CTA */}
      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate("/accounting/closing-entries/create")}
        >
          <Plus className="mr-2" /> Create Closure
        </Button>
      </div>

      {/* Filter + Pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        {/* Office name search */}
        <Input
          placeholder="Office Name"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="max-w-sm h-11 text-base"
        />

        {/* Items per page + Prev/Next */}
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

      {/* Closures table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          {/* Table meta */}
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>

          {/* Header */}
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Office</TableHead>
              <TableHead className="px-6 py-4">Closure Date</TableHead>
              <TableHead className="px-6 py-4">Comments</TableHead>
              <TableHead className="px-6 py-4">Created By</TableHead>
            </TableRow>
          </TableHeader>

          {/* Rows */}
          <TableBody>
            {paginated.map((closure, idx) => (
              <TableRow key={idx} onClick={()=>navigate(`/accounting/closing-entries/view/${closure.id}`)} className="text-base hover:bg-muted">
                <TableCell className="px-6 py-4">{closure.officeName}</TableCell>
                <TableCell className="px-6 py-4">{closure.closingDate}</TableCell>
                <TableCell className="px-6 py-4">{closure.comments || "—"}</TableCell>
                <TableCell className="px-6 py-4">{closure.createdByUsername || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Closure;
