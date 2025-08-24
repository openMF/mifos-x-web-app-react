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
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { getConfiguration } from "@/lib/fineract-openapi";
import { PaymentTypeApi, type PaymentTypeData } from "@/fineract-api";
import { Pencil, Trash2, Plus, CheckCircle, XCircle } from "lucide-react";

const api = new PaymentTypeApi(getConfiguration());

const Payment = () => {
  const [data, setData] = useState<PaymentTypeData[]>([]);
  const [filtered, setFiltered] = useState<PaymentTypeData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  // fetch all payment types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getAllPaymentTypes();
        setData(res.data || []);
      } catch (e) {
        console.error("Error fetching payment types", e);
      }
    };
    fetchData();
  }, []);

  // filter list based on search
  useEffect(() => {
    const f = data.filter((pt) =>
      pt.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(f);
    setPage(1);
  }, [searchTerm, data]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setPage(1);
  };

  // delete payment type
  const handleDelete = async (deleteId: number) => {
    try {
      await api.deleteCode1(deleteId);
      setData((prev) => prev.filter((item) => item.id !== deleteId));
    } catch (err) {
      console.error("Failed to delete Payment Type", err);
    }
  };

  // render boolean icons
  const renderBool = (val?: boolean) =>
    val ? <CheckCircle className="text-green-500" /> : <XCircle className="text-rose-500" />;

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Organization", href: "/organization" },
          { label: "Payment Types", current: true },
        ]}
      />

      {/* create new payment type */}
      <div className="flex gap-4 mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate("/organization/payment-types/create")}
        >
          <Plus className="mr-2" /> Create Payment Type
        </Button>
      </div>

      {/* search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search Payment Types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* payment types table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Description</TableHead>
              <TableHead className="px-6 py-4">Code</TableHead>
              <TableHead className="px-6 py-4">System Defined</TableHead>
              <TableHead className="px-6 py-4">Cash Payment</TableHead>
              <TableHead className="px-6 py-4">Position</TableHead>
              <TableHead className="px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-6 py-4 max-w-[180px] break-words whitespace-normal">{item.name || "—"}</TableCell>
                <TableCell className="px-6 py-4 max-w-[180px] break-words whitespace-normal">{item.description || "—"}</TableCell>
                <TableCell className="px-6 py-4 max-w-[180px] break-words whitespace-normal">{item.codeName || "—"}</TableCell>
                <TableCell className="px-6 py-4">{renderBool(item.isSystemDefined)}</TableCell>
                <TableCell className="px-6 py-4">{renderBool(item.isCashPayment)}</TableCell>
                <TableCell className="px-6 py-4">{item.position ?? "—"}</TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {/* edit action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/organization/payment-types/${item.id}/edit`)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {/* delete action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-500"
                      onClick={() => handleDelete(item.id!)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Payment;
