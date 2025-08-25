import { useNavigate } from "react-router-dom"
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs"

const ManageDeliquencyBuckets = () => {
    const navigate = useNavigate();

    // Handle navigation when a section is clicked
    const handleClick = (path: string) => {
        navigate(`/products/delinquency-bucket-configurations/${path}`);
    }

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
            {/* Breadcrumb navigation */}
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: '/home' },
                    { label: "Products", href: '/products' },
                    { label: "Manage Delinquency Bucket Configurations", current: true },
                ]}
            />

            {/* Main card with two options */}
            <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 ">
                    {/* Option to manage ranges */}
                    <div
                        className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
                        onClick={() => handleClick('ranges')}
                    >
                        Manage Delinquency Ranges
                    </div>

                    {/* Option to manage buckets */}
                    <div
                        className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
                        onClick={() => handleClick('buckets')}
                    >
                        Manage Delinquency Buckets
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ManageDeliquencyBuckets
