import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

import {
  DataTablesApi,
  type GetDataTablesResponse,
  type ResultsetColumnHeaderData,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";

const dataTablesApi = new DataTablesApi(getConfiguration());

const ViewDataTables = () => {
  const { id } = useParams<{ id: string }>();

  const [assocWith, setAssocWith] = useState("");
  const [fields, setFields] = useState<ResultsetColumnHeaderData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch datatable details
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await dataTablesApi.getDatatable(id);
        const data: GetDataTablesResponse = res?.data ?? {};
        setAssocWith(data.registeredTableName ?? data.applicationTableName ?? "");
        setFields(Array.isArray(data.columnHeaderData) ? data.columnHeaderData : []);
      } catch (err) {
        console.error("Failed to fetch datatable", err);
        setAssocWith("");
        setFields([]);
      }
    })();
  }, [id]);

  // Filter + pagination
  const filtered = fields.filter((c) =>
    String((c as any).columnName ?? (c as any).name ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleItemsChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setPage(1);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "System", href: "/system" },
          { label: "Manage Data Tables", href: "/system/data-tables" },
          { label: id ?? "—", current: true },
        ]}
      />

      {/* Search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search fields…"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="max-w-sm h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsChange}>
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

      {/* Associated With info */}
      <div className="mb-4 rounded-md border bg-white dark:bg-zinc-900">
        <div className="px-6 py-4 text-sm">
          <span className="font-medium">Associated With</span>{" "}
          <span className="text-zinc-600 dark:text-zinc-300">{assocWith || "—"}</span>
        </div>
      </div>

      {/* Fields Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>

          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Field Name</TableHead>
              <TableHead className="px-6 py-4">Type</TableHead>
              <TableHead className="px-6 py-4">Length</TableHead>
              <TableHead className="px-6 py-4">Code</TableHead>
              <TableHead className="px-6 py-4">Mandatory</TableHead>
              <TableHead className="px-6 py-4">Unique</TableHead>
              <TableHead className="px-6 py-4">Indexed</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((c, idx) => (
              <TableRow key={idx} className="text-base hover:bg-zinc-100 dark:hover:bg-zinc-700">
                <TableCell className="px-6 py-4 font-medium">
                  {(c as any).columnName ?? (c as any).name ?? ""}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {String((c as any).columnType ?? (c as any).type ?? "").toUpperCase()}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {(c as any).columnLength ?? (c as any).length ?? 0}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {(c as any).code ?? (c as any).codeName ?? (c as any).columnCode ?? "—"}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <FontAwesomeIcon
                    icon={(c as any).mandatory || (c as any).isMandatory ? faCircleCheck : faCircleXmark}
                    className={(c as any).mandatory || (c as any).isMandatory ? "w-4 h-4 text-green-500" : "w-4 h-4 text-red-500"}
                  />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <FontAwesomeIcon
                    icon={(c as any).unique || (c as any).isUnique ? faCircleCheck : faCircleXmark}
                    className={(c as any).unique || (c as any).isUnique ? "w-4 h-4 text-green-500" : "w-4 h-4 text-red-500"}
                  />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <FontAwesomeIcon
                    icon={(c as any).indexed || (c as any).isIndexed ? faCircleCheck : faCircleXmark}
                    className={(c as any).indexed || (c as any).isIndexed ? "w-4 h-4 text-green-500" : "w-4 h-4 text-red-500"}
                  />
                </TableCell>
              </TableRow>
            ))}

            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                  No fields found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ViewDataTables;
