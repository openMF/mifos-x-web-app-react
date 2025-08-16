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

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs';

import { GeneralLedgerAccountApi, type GetGLAccountsResponse } from '@/fineract-api';
import { getConfiguration } from "@/lib/fineract-openapi";

import { Plus } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';


//gl accounts base api
const glApi = new GeneralLedgerAccountApi(getConfiguration());

const ChartOfAccounts = () => {
    const navigate = useNavigate();

    //stores all gl accounts
    const [glAccounts, setGlAccounts] = useState<GetGLAccountsResponse[]>([]);

    //sets the gl code account name to be searched
    const [searchTerm, setSearchTerm] = useState("");

    const [page, setPage] = useState(1);

    //sets the gl accounts per page
    const [itemsPerPage, setItemsPerPage] = useState(10);

    //Api call to get all GL accounts data
    useEffect(() => {
        const fetchGlAccounts = async () => {
            try {
                const response = await glApi.retrieveAllAccounts();
                setGlAccounts(response.data);
            } catch (err) {
                console.log("Failed to fetch Gl Accounts", err);
            }
        };
        fetchGlAccounts();
    }, [])

    const filtered = glAccounts.filter((acc) =>
        (acc.name?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
        (acc.glCode?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(parseInt(value));
        setPage(1);
    };

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
            {/* Bread crumbs */}
            <AppBreadCrumbs
                items={[
                    {label:"Home", href:"/home"},
                    {label:"Accounting"},
                    {label:"Chart of Accounts", current:true}
                ]}
            />

            {/* Add Account Button */}
            <div className="mb-6">
                <Button
                    className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
                    onClick={() => navigate('/accounting/chart-of-accounts/gl-accounts/create')}>
                    <Plus className="mr-2" /> Add Account
                </Button>
            </div>

            {/* Search Controls and Pages */}
            <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
                <Input
                    placeholder="Search accounts..."
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

            {/* GL Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <Table>
                    <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
                        Showing {paginated.length} of {filtered.length} items • Page {page} of {totalPages}
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="text-base">
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Account</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">GL Code</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Type</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Disabled</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Manual Entries</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Used As</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paginated.map((acc) => (
                            <TableRow
                                key={acc.id}
                                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                                onClick={() => navigate(`/accounting/chart-of-accounts/gl-accounts/view/${acc.id}`)}
                            >
                                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">{acc.name}</TableCell>
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">{acc.glCode}</TableCell>
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">{acc.type?.value}</TableCell>
                                <TableCell className="px-6 py-4 text-zinc-800 dark:text-zinc-100">
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        className={acc.disabled ? "text-red-500 w-4 h-4" : "text-green-500 w-4 h-4"}
                                    />
                                </TableCell>
                                <TableCell className="px-6 py-4 text-zinc-800 dark:text-zinc-100">
                                    <FontAwesomeIcon
                                        icon={acc.manualEntriesAllowed ? faCircleCheck : faCircleXmark}
                                        className={`w-4 h-4 ${acc.manualEntriesAllowed ? "text-green-500" : "text-red-500"}`}
                                    />
                                </TableCell>
                                <TableCell className="px-6 py-4 text-zinc-800 dark:text-zinc-100">{acc.usage?.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ChartOfAccounts;