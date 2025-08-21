import { NavLink, Outlet } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

const CheckerInBoxAndTasks = () => {
    const tabItems = [
        {
            label: "Checker Inbox",
            path: "/checker-inbox-and-tasks/checker-inbox",
        },
        {
            label: "Client Approval",
            path: "/checker-inbox-and-tasks/client-approval",
        },
        {
            label: "Loan Approval",
            path: "/checker-inbox-and-tasks/loan-approval",
        },
        {
            label: "Loan Disbursal",
            path: "/checker-inbox-and-tasks/loan-disbursal",
        },
        {
            label: "Reschedule Loan",
            path: "/checker-inbox-and-tasks/reschedule-loan",
        },
    ];

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">

            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Checker Inbox & Tasks", current: true }
                ]}
            />

            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm px-6 py-3">
                <div className="flex justify-between border-b border-gray-300 dark:border-zinc-700 mb-6">
                    {tabItems.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                isActive
                                    ? "text-blue-600 border-b-2 border-blue-600 pb-2 px-3"
                                    : "text-gray-500 border-b-2 border-transparent hover:text-gray-800 hover:border-gray-300 pb-2 px-3"
                            }
                        >
                            {tab.label}
                        </NavLink>

                    ))}
                </div>
                <div>
                    <Outlet />
                </div>
            </div>



        </div>
    );
};

export default CheckerInBoxAndTasks;
