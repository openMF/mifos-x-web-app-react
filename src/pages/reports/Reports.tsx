import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { getConfiguration } from "@/lib/fineract-openapi";
import { ReportsApi, type GetReportsResponse } from "@/fineract-api";
import { useParams, useNavigate } from "react-router-dom";

const reportsApi = new ReportsApi(getConfiguration());

const Reports = () => {
  const { category } = useParams();
  const navigate = useNavigate();

  const [reports, setReports] = useState<GetReportsResponse[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await reportsApi.retrieveReportList();
        const details = response.data ?? [];

        if (!category) {
          setReports(details);
        } else {
          const filtered = details.filter(
            (e) => e.reportCategory === category.charAt(0).toUpperCase() + category.slice(1)
          );
          setReports(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch reports", error);
      }
    };
    fetchReports();
  }, [category]);

  const filtered = reports.filter((report) =>
    report.reportName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setPage(1);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Reports", current: true },
        ]}
      />

      <h2 className="text-2xl font-semibold mb-6">Reports</h2>

      {/* Search + Pagination Controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
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
              {[5, 10, 25, 50].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
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

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} reports • Page {page} of {totalPages}
          </TableCaption>

          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Type</TableHead>
              <TableHead className="px-6 py-4">Category</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((report, idx) => (
              <TableRow
                key={idx}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={() => navigate(`/reports/run/${encodeURIComponent(report.reportName!)}`)}
              >
                <TableCell className="px-6 py-4 font-medium">{report.reportName}</TableCell>
                <TableCell className="px-6 py-4">{report.reportType}</TableCell>
                <TableCell className="px-6 py-4">{report.reportCategory}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Reports;
