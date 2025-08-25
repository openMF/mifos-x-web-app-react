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
    LoanProductsApi,
    type GetLoanProductsResponse,
} from "@/fineract-api";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// API instance
const LoanProductApi = new LoanProductsApi(getConfiguration());

const LoanProducts = () => {
    // State for products and UI controls
    const [loanProducts, setLoanProducts] = useState<GetLoanProductsResponse[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const navigate = useNavigate();

    // Fetch loan products on mount
    useEffect(() => {
        const fetchLoanProducts = async () => {
            try {
                const response = await LoanProductApi.retrieveAllLoanProducts();
                setLoanProducts(response.data || []);
            } catch (err) {
                console.error("Failed to fetch loan products", err);
            }
        };
        fetchLoanProducts();
    }, []);

    // Filter by name/shortName
    const filtered = loanProducts.filter(
        (acc) =>
            acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.shortName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination helpers
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginated = filtered.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

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
                    { label: "Loan Products", current: true },
                ]}
            />

            {/* Create Loan Product button */}
            <div className="mb-6">
                <Button
                    className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
                    onClick={() => navigate('/products/loan-products/create')}>
                    <Plus className="mr-2" /> Create Loan Product
                </Button>
            </div>

            {/* Search & pagination controls */}
            <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
                {/* Search input */}
                <Input
                    placeholder="Search Loan Products..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    className="max-w-sm h-11 text-base"
                />

                {/* Page size dropdown + navigation */}
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

            {/* Data Table */}
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
                            <TableHead className="px-6 py-4">Short Name</TableHead>
                            <TableHead className="px-6 py-4">Expiry Date</TableHead>
                            <TableHead className="px-6 py-4">Status</TableHead>
                        </TableRow>
                    </TableHeader>

                    {/* Table body */}
                    <TableBody>
                        {paginated.map((loan) => (
                            <TableRow
                                key={loan.id}
                                onClick={() => navigate(`/products/loan-products/${loan.id}/general`)}
                                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                            >
                                {/* Product Name */}
                                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                                    {loan.name}
                                </TableCell>

                                {/* Short Name */}
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                                    {loan.shortName}
                                </TableCell>

                                {/* Expiry Date */}
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                                    {Array.isArray(loan.endDate) && loan.endDate.length === 3
                                        ? new Date(
                                            Number(loan.endDate[0]),
                                            Number(loan.endDate[1]) - 1,
                                            Number(loan.endDate[2])
                                        ).toLocaleDateString()
                                        : "—"}
                                </TableCell>

                                {/* Status - active/inactive indicator */}
                                <TableCell className="px-6 py-4">
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        className={
                                            loan.status == "loanProduct.active"
                                                ? "text-green-500 w-4 h-4"
                                                : "text-gray-500 w-4 h-4"
                                        }
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

export default LoanProducts;
