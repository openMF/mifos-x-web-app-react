import { useEffect, useState } from "react"; // react hooks
import { useNavigate } from "react-router-dom"; // for navigation

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
} from "@/components/ui/select"; // select dropdown
import { Button } from "@/components/ui/button"; // button

import AppSearch from "@/components/custom/search/AppSearch"; // search input
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs"; // breadcrumb

import { UsersApi, type AppUser, type GetUsersResponse } from "@/fineract-api"; // api + types
import { getConfiguration } from "@/lib/fineract-openapi"; // api config

import { Plus } from "lucide-react";

const usersApi = new UsersApi(getConfiguration()); // API

const Users = () => {

    const navigate = useNavigate();
    const [users, setUsers] = useState<GetUsersResponse[] | null>(null); // all users
    const [searchTerm, setSearchTerm] = useState(""); // search query

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await usersApi.retrieveAll41(); // api call to fetch users
                setUsers(res.data);
            } catch (err) {
                console.log("Failed to fetch User details", err)
            }
        }
        fetchUsers();
    }, [])

    const [page, setPage] = useState(1); // current page
    const [itemsPerPage, setItemsPerPage] = useState(10); // rows per page

    // filter by first/last name
    const filtered = users?.filter((user: AppUser) =>
        (user.firstname?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
        (user.lastname?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
    ) ?? [];

    const totalPages = Math.ceil(filtered.length / itemsPerPage); // total pages
    const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage); // slice list

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(parseInt(value)); // set rows per page
        setPage(1); // reset to first page
    };

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">

            {/* breadcrumbs */}
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Users", current: true }
                ]}
            />

            {/* create user button */}
            <div className="mb-6">
                <Button
                    className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
                    onClick={() => navigate('/appusers/create')}>
                    <Plus className="mr-2" /> Create User
                </Button>
            </div>

            {/* search + pagination controls */}
            <div className="flex flex-wrap justify-between items-center gap-6 mb-6">

                <AppSearch
                    placeholder="Search accounts"
                    searchItem={searchTerm}
                    setsearchItem={setSearchTerm}
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

                    {/* prev button */}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Prev
                    </Button>

                    {/* next button */}
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

            {/* users table */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <Table>
                    <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="text-base">
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">First Name</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Last Name</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Email</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Office</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paginated.map((user) => (
                            <TableRow
                                key={user.id}
                                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                                onClick={() => navigate(`/appusers/${user.id}`)} // navigate to user details
                            >
                                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">{user.firstname}</TableCell>
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">{user.lastname}</TableCell>
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">{user.email}</TableCell>
                                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">{user.officeName}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default Users
