import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { getConfiguration } from "@/lib/fineract-openapi";
import {
    DelinquencyRangeAndBucketsManagementApi,
    type DelinquencyRangeData,
} from "@/fineract-api";

import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// API instance for delinquency ranges
const delinquencyApi = new DelinquencyRangeAndBucketsManagementApi(getConfiguration());

const ViewDelinquencyRange = () => {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const [range, setRange] = useState<DelinquencyRangeData>();

    // Delete handler
    const handleDelete = async () => {
        try {
            await delinquencyApi.deleteDelinquencyRange(Number(id));
            navigate("/products/delinquency-bucket-configurations/ranges");
        } catch (err) {
            console.error("Failed to delete delinquency range", err);
        }
    };

    // Fetch range details when component mounts or id changes
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await delinquencyApi.getDelinquencyRange(Number(id));
                setRange(res.data);
            } catch (err) {
                console.error("Failed to fetch delinquency range", err);
            }
        };
        fetch();
    }, [id]);

    return (
        <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
            {/* Breadcrumb navigation */}
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Products", href: "/products" },
                    { label: "Manage Delinquency Bucket Configurations", href: "/products/delinquency-bucket-configurations" },
                    { label: "Delinquency Ranges", href: "/products/delinquency-bucket-configurations/ranges" },
                    { label: `${range?.classification}`, current: true },
                ]}
            />

            {/* Card container */}
            <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
                {/* Action buttons */}
                <div className="flex justify-between">
                    <div className="flex gap-4 mb-6">
                        <Button
                            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
                            onClick={() => navigate(`/products/delinquency-bucket-configurations/ranges/${id}/edit`)}
                        >
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                        </Button>

                        {/* Delete confirmation dialog */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete {range?.classification}?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                        onClick={handleDelete}
                                    >
                                        Confirm
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Details section */}
                <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
                    Delinquency Range Details
                </h2>

                <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
                    <div className="font-medium">Classification</div>
                    <div className="text-zinc-600 dark:text-zinc-400">{range?.classification || "-"}</div>

                    <div className="font-medium">Days From</div>
                    <div className="text-zinc-600 dark:text-zinc-400">{range?.minimumAgeDays ?? "-"}</div>

                    <div className="font-medium">Days Till</div>
                    <div className="text-zinc-600 dark:text-zinc-400">{range?.maximumAgeDays ?? "-"}</div>
                </div>

                {/* Back button */}
                <div className="flex justify-center mt-8">
                    <Button
                        variant="outline"
                        className="w-28 cursor-pointer"
                        onClick={() => navigate("/products/delinquency-bucket-configurations/ranges")}
                    >
                        Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ViewDelinquencyRange;
