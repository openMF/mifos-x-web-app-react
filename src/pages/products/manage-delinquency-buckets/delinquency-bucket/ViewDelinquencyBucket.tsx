import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs"

import { getConfiguration } from "@/lib/fineract-openapi"
import { DelinquencyRangeAndBucketsManagementApi, type DelinquencyBucketData } from "@/fineract-api"

import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

// API instance
const delinquencyApi = new DelinquencyRangeAndBucketsManagementApi(getConfiguration());

const ViewDelinquencyBucket = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // bucket id from route
    const [buckets, setBuckets] = useState<DelinquencyBucketData>(); // state for bucket details

    // Handle delete action
    const handleDelete = async() => {
        try{
            await delinquencyApi.deleteDelinquencyBucket(Number(id));
            navigate("/products/delinquency-bucket-configurations/buckets");
        }catch(err){
            console.log("Failed to Delete Bucket",err)
        }
    }

    // Fetch bucket details on mount
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await delinquencyApi.getDelinquencyBucket(Number(id));
                setBuckets(res.data);
            } catch (err) {
                console.error("Failed to fetch delinquency buckets", err);
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
                    { label: "Products", href: '/products' },
                    { label: "Manage Delinquency Bucket Configurations", href: '/products/delinquency-bucket-configurations' },
                    { label: "Delinquency Buckets", href: "/products/delinquency-bucket-configurations/buckets" },
                    { label: `${buckets?.name}`, current: true },
                ]}
            />

            {/* Card for details */}
            <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
                {/* Action buttons (Edit + Delete) */}
                <div className="flex justify-between">
                    <div className="flex gap-4 mb-6">
                        <Button
                            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
                            onClick={() => navigate(`/products/delinquency-bucket-configurations/buckets/${buckets?.id}/edit`)}
                        >
                            <FontAwesomeIcon icon={faPenToSquare} />Edit
                        </Button>

                        {/* Delete confirmation dialog */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faTrash} />Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete {buckets?.name}
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

                {/* Heading */}
                <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
                    Delinquency Bucket Details
                </h2>

                {/* Bucket details */}
                <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
                    <div className="font-medium">Name</div>
                    <div className="text-zinc-600 dark:text-zinc-400">{buckets?.name}</div>

                    <div className="font-medium">Classification Name </div>
                    <div className="text-zinc-600 dark:text-zinc-400">{buckets?.ranges?.[0]?.classification || "-"}</div>

                    <div className="font-medium">Days From</div>
                    <div className="text-zinc-600 dark:text-zinc-400">{buckets?.ranges?.[0]?.minimumAgeDays || "-"}</div>

                    <div className="font-medium">Days Till</div>
                    <div className="text-zinc-600 dark:text-zinc-400">{buckets?.ranges?.[0]?.maximumAgeDays || "-"}</div>
                </div>

                {/* Back button */}
                <div className="flex justify-center mt-8">
                    <Button
                        variant="outline"
                        className="w-28 cursor-pointer"
                        onClick={() => navigate("/products/delinquency-bucket-configurations/buckets")}
                    >
                        Back
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ViewDelinquencyBucket
