import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { GroupsApi, type GetGroupsPageItems } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

import { Plus } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { Checkbox } from "@/components/ui/checkbox";

const groupsApi = new GroupsApi(getConfiguration());

const Groups = () => {
  const navigate = useNavigate();

  // State for groups data
  const [groups, setGroups] = useState<GetGroupsPageItems[]>([]);
  // Search filter state
  const [searchTerm, setSearchTerm] = useState("");
  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Checkbox toggle (show pending vs only active)
  const [checked, setChecked] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await groupsApi.retrieveAll24(
          undefined, // officeId
          undefined, // staffId
          undefined, // externalId
          undefined, // name
          undefined, // underHierarchy
          true,      // paged
          0,         // offset
          100,       // limit
          "",        // orderBy
          ""         // sortOrder
        );
        const items = Array.from(response.data?.pageItems ?? []);
        setGroups(items);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };

    fetchGroups();
  }, []);

  // Filtering logic: match search term + status filter
  const filtered = groups.filter((group) => {
    const matchesSearch =
      (group.name?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());
      // Optionally also check externalId, but commented out for now

    const status = group.status?.id ?? "";
    const showBasedOnStatus = checked
      ? status === 300 || status === 100 // include pending
      : status === 300;                  // only active

    return matchesSearch && showBasedOnStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
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
          { label: "Groups", href: "/groups" },
        ]}
      />

      {/* Add Group Button */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/groups/create')}
        >
          <Plus className="mr-2" /> Add Group
        </Button>
      </div>

      {/* Search + Pagination Controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        {/* Search input */}
        <Input
          placeholder="Search by Name or External ID..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="max-w-sm h-11 text-base"
        />

        {/* Items per page + pagination */}
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

          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>

      {/* Pending groups toggle */}
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="pending-groups"
          checked={checked}
          onCheckedChange={(val) => setChecked(!!val)}
        />
        <label htmlFor="pending-groups" className="text-base dark:text-white">
          Show Pending Groups
        </label>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          {/* Caption */}
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>

          {/* Table Header */}
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Account #</TableHead>
              <TableHead className="px-6 py-4">External ID</TableHead>
              <TableHead className="px-6 py-4">Status</TableHead>
              <TableHead className="px-6 py-4">Office Name</TableHead>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {paginated.map((group) => (
              <TableRow
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}/general`)}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
              >
                <TableCell className="px-6 py-4 font-medium">{group.name}</TableCell>
                <TableCell className="px-6 py-4">{"Missing in OpenAPI"}</TableCell>
                <TableCell className="px-6 py-4">{"Missing in OpenAPI"}</TableCell>
                <TableCell className="px-6 py-4">
                  {group.status?.id === 300 && (
                    <FontAwesomeIcon icon={faCircle} className="text-green-500 w-4 h-4" />
                  )}
                  {group.status?.id === 100 && (
                    <FontAwesomeIcon icon={faCircle} className="text-yellow-500 w-4 h-4" />
                  )}
                </TableCell>
                <TableCell className="px-6 py-4">{group.officeName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Groups;
