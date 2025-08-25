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

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { getConfiguration } from "@/lib/fineract-openapi";
import {
    ChargesApi,
    type GetChargesResponse,
} from "@/fineract-api";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// API instance
const chargesApi = new ChargesApi(getConfiguration());

const Charges = () => {
    // State for charges list
    const [charges, setCharges] = useState<GetChargesResponse[]>([]);
    // Search filter
    const [searchTerm, setSearchTerm] = useState("");
    // Pagination state
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const navigate = useNavigate();

    // Fetch all charges on mount
    useEffect(() => {
        const fetchCharges = async () => {
            try {
                const response = await chargesApi.retrieveAllCharges();
                setCharges(response.data || []);
            } catch (err) {
                console.error("Failed to fetch charges", err);
            }
        };
        fetchCharges();
    }, []);

    // Apply search filter
    const filtered = charges.filter((c) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginated = filtered.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Change items per page
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
                    { label: "Products", href: "/products" },
                    { label: "Charges", current: true },
                ]}
            />

            {/* Create button */}
            <div className="mb-6">
                <Button
                    className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
                    onClick={() => navigate("/products/charges/create")}
                >
                    <Plus className="mr-2" /> Create Charge
                </Button>
            </div>

            {/* Search + Pagination Controls */}
            <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
                {/* Search input */}
                <Input
                    placeholder="Search Charges..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    className="max-w-sm h-11 text-base"
                />

                <div className="flex items-center gap-2">
                    {/* Items per page dropdown */}
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

                    {/* Prev / Next buttons */}
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        Prev
                    </Button>

                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        Next
                    </Button>
                </div>
            </div>

            {/* Charges Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
                <Table>
                    {/* Table caption */}
                    <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
                        Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
                    </TableCaption>

                    {/* Table header */}
                    <TableHeader>
                        <TableRow className="text-base">
                            <TableHead className="px-6 py-4">Name</TableHead>
                            <TableHead className="px-6 py-4">Applies To</TableHead>
                            <TableHead className="px-6 py-4">Time</TableHead>
                            <TableHead className="px-6 py-4">Calculation</TableHead>
                            <TableHead className="px-6 py-4">Amount</TableHead>
                            <TableHead className="px-6 py-4">Is Penalty?</TableHead>
                            <TableHead className="px-6 py-4">Is Active?</TableHead>
                        </TableRow>
                    </TableHeader>

                    {/* Table body */}
                    <TableBody>
                        {paginated.map((charge) => (
                            <TableRow
                                key={charge.id}
                                onClick={() => navigate(`/products/charges/${charge.id}`)}
                                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                            >
                                {/* Charge Name */}
                                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                                    {charge.name}
                                </TableCell>

                                {/* Applies To */}
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                                    {charge.chargeAppliesTo?.code
                                        ? charge.chargeAppliesTo.code.split('.').pop()?.replace(/^\w/, c => c.toUpperCase())
                                        : "—"}
                                </TableCell>

                                {/* Charge Time */}
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                                    {charge.chargeTimeType?.code
                                        ? charge.chargeTimeType.code.split('.').pop()?.replace(/^\w/, c => c.toUpperCase())
                                        : "—"}
                                </TableCell>

                                {/* Calculation Type */}
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                                    {charge.chargeCalculationType?.code
                                        ? charge.chargeCalculationType.code.split('.').pop()?.replace(/^\w/, c => c.toUpperCase())
                                        : "—"}
                                </TableCell>

                                {/* Amount */}
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                                    {charge.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>

                                {/* Is Penalty */}
                                <TableCell className="px-6 py-4">
                                    <FontAwesomeIcon
                                        icon={faCircleXmark}
                                        className={charge.penalty ? "text-red-500 w-4 h-4" : "text-red-500 w-4 h-4"}
                                    />
                                </TableCell>

                                {/* Active Status */}
                                <TableCell className="px-6 py-4">
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        className={charge.active ? "text-green-500 w-4 h-4" : "text-red-500 w-4 h-4"}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default Charges;
