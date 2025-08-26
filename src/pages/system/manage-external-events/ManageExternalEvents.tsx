import { useEffect, useState } from "react";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  ExternalEventConfigurationApi,
  type ExternalEventConfigurationItemData,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const externalEventsApi = new ExternalEventConfigurationApi(getConfiguration());

const ManageExternalEvents = () => {
  const [externalEvents, setExternalEvents] = useState<ExternalEventConfigurationItemData[]>([]);
  const [baseline, setBaseline] = useState<Record<string, boolean>>({});

  const [filter, setFilter] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await externalEventsApi.retrieveExternalEventConfiguration();
        const list = res.data.externalEventConfiguration ?? [];
        setExternalEvents(list);

        const map: Record<string, boolean> = {};
        for (const it of list) {
          if (it?.type) map[it.type] = !!it.enabled;
        }
        setBaseline(map);
      } catch (err) {
        console.log("Couldn't fetch External Events Data", err);
      }
    };
    fetchDetails();
  }, []);

  const filtered = externalEvents.filter((e) =>
    (e.type ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  let isDirty = false;
  for (const item of externalEvents) {
    const t = item.type ?? "";
    if (!t) continue;
    if ((item.enabled ?? false) !== (baseline[t] ?? false)) {
      isDirty = true;
      break;
    }
  }

  const toggle = (idxOnPage: number) => {
    const idx = start + idxOnPage; 
    const target = paginated[idxOnPage];
    const originalIndex = externalEvents.findIndex((e) => e.type === target.type);
    if (originalIndex === -1) return;

    setExternalEvents((prev) =>
      prev.map((e, i) => (i === originalIndex ? { ...e, enabled: !e.enabled } : e))
    );
  };

  const applyChanges = async () => {
    // build only changed keys
    const externalEventConfigurations: Record<string, boolean> = {};
    for (const it of externalEvents) {
      const t = it.type ?? "";
      if (!t) continue;
      const curr = !!it.enabled;
      const base = !!baseline[t];
      if (curr !== base) externalEventConfigurations[t] = curr;
    }
    if (Object.keys(externalEventConfigurations).length === 0) return;

    const payload = { changes: { externalEventConfigurations } };

    try {
      setSubmitting(true);

      // refresh baseline after success
      const newBase: Record<string, boolean> = {};
      for (const it of externalEvents) {
        if (it?.type) newBase[it.type] = !!it.enabled;
      }
      setBaseline(newBase);
      alert("External events updated.");
    } catch (err) {
      console.error("Failed to apply changes", err);
      alert("Failed to apply changes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "System", href: "/system" },
          { label: "Manage External Events", current: true },
        ]}
      />

      {/* Top bar: Filter + Apply Changes */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">Filter</div>
        <Button
          variant="secondary"
          disabled={!isDirty || submitting}
          className={!isDirty || submitting ? "opacity-60 cursor-not-allowed" : ""}
          onClick={applyChanges}
        >
          {submitting ? "Applying…" : "Apply Changes"}
        </Button>
      </div>

      {/* Filter + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search events…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="max-w-md h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => {
              setItemsPerPage(parseInt(v, 10));
              setPage(1);
            }}
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

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Event Type</TableHead>
              <TableHead className="px-6 py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row, idx) => (
              <TableRow key={row.type} className="text-base">
                <TableCell className="px-6 py-4 font-medium">
                  {row.type}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!!row.enabled}
                      onCheckedChange={() => toggle(idx)}
                    />
                    <span className={row.enabled ? "text-green-600 font-medium" : "text-rose-500 font-medium"}>
                      {row.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-zinc-500">
                  No events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ManageExternalEvents;
