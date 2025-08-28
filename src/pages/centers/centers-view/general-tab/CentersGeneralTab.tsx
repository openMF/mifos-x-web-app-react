import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { RunReportsApi, CentersApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const runReportApi = new RunReportsApi(getConfiguration());
const centersApi = new CentersApi(getConfiguration());

const CentersGeneralTab = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State for group summary counts, groups list, and loading flag
  const [summary, setSummary] = useState<any>({});
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Fetch summary counts for this center
        const sumRes = await runReportApi.runReport("GroupSummaryCounts", false, {
          params: {
            R_groupId: Number(id),
            genericResultSet: false,
          },
        });
        setSummary(sumRes.data?.data?.[0] ?? {});

        // Fetch groups associated with this center
        const centerRes = await (centersApi as any).retrieveOne14(Number(id), {
          params: { associations: "groupMembers" },
        });
        setGroups(centerRes?.data?.groupMembers ?? []);
      } catch (e) {
        console.error("Error fetching general tab data", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Helper to format dates
  const fmtDate = (arr: any) =>
    Array.isArray(arr)
      ? new Date(arr[0], arr[1] - 1, arr[2]).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4 text-black dark:text-white">
      {/*Summary Section*/}
      <div>
        <h2 className="text-lg font-semibold">Summary Details</h2>
        <div>Active Clients: {summary["Active Clients"] ?? 0}</div>
        <div>Active Group Borrowers: {summary["Active Group Borrowers"] ?? 0}</div>
        <div>Active Group Loans: {summary["Active Group Loans"] ?? 0}</div>
        <div>Active Client Borrowers: {summary["Active Client Borrowers"] ?? 0}</div>
        <div>Active Client Loans: {summary["Active Client Loans"] ?? 0}</div>
        <div>Active Overdue Client Loans: {summary["Active Overdue Client Loans"] ?? 0}</div>
        <div>Active Overdue Group Loans: {summary["Active Overdue Group Loans"] ?? 0}</div>
      </div>

      {/*Groups Table*/}
      <h2 className="text-lg font-semibold">Groups</h2>
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Account No</TableHead>
              <TableHead className="px-6 py-4">Group Name</TableHead>
              <TableHead className="px-6 py-4">Office Name</TableHead>
              <TableHead className="px-6 py-4 text-right">Submitted On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g: any) => (
              <TableRow
                key={g.id}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                onClick={() => navigate(`/groups/${g.id}/general`)}
              >
                <TableCell className="px-6 py-4">
                  <span className="inline-block w-3 h-3 bg-yellow-500 rounded-sm mr-2 align-middle" />
                  <span className="align-middle">{g.accountNo ?? "-"}</span>
                </TableCell>
                <TableCell className="px-6 py-4">{g.name ?? "-"}</TableCell>
                <TableCell className="px-6 py-4">{g.officeName ?? "-"}</TableCell>
                <TableCell className="px-6 py-4 text-right">{fmtDate(g?.timeline?.submittedOnDate)}</TableCell>
              </TableRow>
            ))}

            {/* Empty state */}
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="px-6 py-6 text-center text-zinc-500">
                  No groups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CentersGeneralTab;
