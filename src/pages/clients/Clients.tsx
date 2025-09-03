import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Plus } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

import { ClientSearchV2Api } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const clientSearchApi = new ClientSearchV2Api(getConfiguration());

const Clients = () => {
  const navigate = useNavigate();

  // pagination + filters
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [includePending, setIncludePending] = useState(false);

  // API state
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // fetch clients on mount & whenever query/pagination changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await clientSearchApi.searchByText({
          query: searchTerm || undefined,
          page: Math.max(0, page - 1),
          size: itemsPerPage,
        } as any);

        const data: any = res.data || {};
        const content: any[] = data.content || [];
        const totalElements: number = data.totalElements ?? content.length;

        if (!cancelled) {
          setRows(content);
          setTotal(totalElements);
        }
      } catch (e) {
        console.error("Failed to search clients", e);
        if (!cancelled) {
          setRows([]);
          setTotal(0);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [searchTerm, page, itemsPerPage]);

  // toggle pending/active filter
  const filtered = rows.filter((c: any) => {
    const statusId = c?.status?.id ?? 0;
    return includePending
      ? statusId === 300 || statusId === 100
      : statusId === 300;
  });

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[{ label: "Home", href: "/home" }, { label: "Clients", current: true }]}
      />

      {/* add client button */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate("/clients/create")}
        >
          <Plus className="mr-2" /> Add Client
        </Button>
      </div>

      {/* search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search by Name, External ID..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="max-w-sm h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => { setItemsPerPage(parseInt(v, 10)); setPage(1); }}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* show pending checkbox */}
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="pending-clients"
          checked={includePending}
          onCheckedChange={(v) => setIncludePending(!!v)}
        />
        <label htmlFor="pending-clients" className="text-base dark:text-white">
          Show Pending Clients
        </label>
      </div>

      {/* results table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {filtered.length} of {total} items • Page {page} of {totalPages}
          </TableCaption>

          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Account No.</TableHead>
              <TableHead className="px-6 py-4">External Id</TableHead>
              <TableHead className="px-6 py-4">Status</TableHead>
              <TableHead className="px-6 py-4">Office Name</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((c: any) => (
              <TableRow
                key={c.id}
                onClick={() => c.id && navigate(`/clients/${c.id}/general`)}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
              >
                <TableCell className="px-6 py-4 font-medium">
                  {c.displayName ?? "—"}
                </TableCell>
                <TableCell className="px-6 py-4">{c.accountNo ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">{c.externalId ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">
                  {c?.status?.id === 300 && (
                    <FontAwesomeIcon icon={faCircle} className="w-4 h-4 text-green-500" />
                  )}
                  {c?.status?.id === 200 && (
                    <FontAwesomeIcon icon={faCircle} className="w-4 h-4 text-yellow-500" />
                  )}
                </TableCell>
                <TableCell className="px-6 py-4">{c.officeName ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Clients;
