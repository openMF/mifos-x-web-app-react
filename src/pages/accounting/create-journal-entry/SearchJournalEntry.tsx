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
import {
  GeneralLedgerAccountApi,
  JournalEntriesApi,
  OfficesApi,
  type GetGLAccountsResponse,
  type GetOfficesResponse,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const officeApi = new OfficesApi(getConfiguration());
const glApi = new GeneralLedgerAccountApi(getConfiguration());
const journalEntryApi = new JournalEntriesApi(getConfiguration());

type Row = {
  id: number | string;
  office: string;
  transactionId: string;
  transactionDate: string;
  type: string;
  createdBy: string;
  submittedOn: string;
  accountCode: string;
  accountName: string;
  currency: string;
};

const SearchJournalEntry = () => {
  const navigate = useNavigate();

  const [offices, setOffices] = useState<GetOfficesResponse[] | null>(null);
  const [glAccounts, setGlAccounts] = useState<GetGLAccountsResponse[]>([]);

  const [entries, setEntries] = useState<Row[]>([]); // <-- you were missing this
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    (async () => {
      try {
        const [officesRes, glAccountsRes, journalRes] = await Promise.all([
          officeApi.retrieveOffices(),
          glApi.retrieveAllAccounts(
            undefined, // type
            undefined, // searchParam
            1,         // usage: ONLY accounts used for journal entries
            true,      // manualEntriesAllowed
            false      // disabled
          ),
          // list journal entries; method names differ between SDKs, but most expose retrieveAll()
          journalEntryApi.retrieveAll1(),
        ]);

        setOffices(officesRes.data ?? []);
        setGlAccounts(glAccountsRes.data ?? []);

        const items = (journalRes?.data as any)?.pageItems ?? journalRes?.data ?? [];
        // Normalize each item into the table shape you render
        const mapped: Row[] = (Array.isArray(items) ? items : []).map((r: any) => ({
          id: r.id ?? r.entryId ?? r.transactionId ?? "",
          office: r.officeName ?? r.office?.name ?? "",
          transactionId: r.transactionId ?? "",
          transactionDate:
            // Fineract often returns dates as arrays [yyyy, mm, dd]
            Array.isArray(r.transactionDate) && r.transactionDate.length >= 3
              ? new Date(r.transactionDate[0], (r.transactionDate[1] ?? 1) - 1, r.transactionDate[2])
                  .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
              : r.transactionDate ?? "",
          type: (r.entryType ?? r.type ?? "").toString(),
          createdBy: r.createdByUserName ?? r.createdBy ?? "",
          submittedOn:
            Array.isArray(r.submittedOnDate) && r.submittedOnDate.length >= 3
              ? new Date(r.submittedOnDate[0], (r.submittedOnDate[1] ?? 1) - 1, r.submittedOnDate[2])
                  .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
              : r.submittedOnDate ?? "",
          accountCode: r.accountCode ?? r.glAccountCode ?? r.glCode ?? "",
          accountName: r.accountName ?? r.glAccountName ?? "",
          currency: r.currencyCode ?? r.currency?.code ?? "",
        }));

        setEntries(mapped);
      } catch (err) {
        console.error("Failed to fetch journal entries", err);
        setEntries([]); // safe fallback
      }
    })();
  }, []);

  const filtered = entries.filter(
    (e) =>
      e.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.accountName.toLowerCase().includes(searchTerm.toLowerCase())
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
          { label: "Search Journal Entries", current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate("/accounting/journal-entries/create")}
        >
          <Plus className="mr-2" /> Create Journal Entry
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search by Transaction ID or Account Name"
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

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[60px]">Office</TableHead>
              <TableHead className="w-[110px]">Transaction ID</TableHead>
              <TableHead className="w-[120px]">Transaction Date</TableHead>
              <TableHead className="w-[60px]">Type</TableHead>
              <TableHead className="w-[80px]">Created By</TableHead>
              <TableHead className="w-[160px]">Submitted On</TableHead>
              <TableHead className="w-[120px]">Account Code</TableHead>
              <TableHead className="w-[220px]">Account Name</TableHead>
              <TableHead className="w-[80px]">Currency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-500 py-6">
                  No journal entries found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((entry) => (
                <TableRow
                  key={entry.id}
                  onClick={() => navigate(`/accounting/journal-entries/${entry.id}`)}
                  className="hover:bg-muted cursor-pointer"
                >
                  <TableCell className="whitespace-pre-wrap break-words">{entry.id}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.office}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.transactionId}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.transactionDate}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.type}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.createdBy}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.submittedOn}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.accountCode}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.accountName}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">{entry.currency}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SearchJournalEntry;
