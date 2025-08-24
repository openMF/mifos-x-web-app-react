import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom"


const Templates = () => {

    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Templates", current: true }
                ]}
            />

            <div className="mb-6">
                <Button
                    className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white">
                    <Plus className="mr-2" /> Create Template
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <Table>
                    <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="text-base">
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Entity</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Type</TableHead>
                            <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">Name</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>

                        <TableRow
                            className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                            onClick={() => navigate(`//`)}
                        >
                            <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">test</TableCell>
                            <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">test</TableCell>
                            <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">test</TableCell>
                        </TableRow>

                    </TableBody>
                </Table>
            </div>
        </div>


    )
}

export default Templates
