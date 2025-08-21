import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

const Profile = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">

      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Profile", current: true }
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex mb-6 gap-4">
          <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white px-4 py-2">
            Permissions
          </Button>
          <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white px-4 py-2">
            Change Password
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          User Information
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Tenant Id</div>
          <div className="text-zinc-600 dark:text-zinc-400">default</div>

          <div className="font-medium">User Id</div>
          <div className="text-zinc-600 dark:text-zinc-400">1</div>

          <div className="font-medium">User Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">mifos</div>

          <div className="font-medium">Office</div>
          <div className="text-zinc-600 dark:text-zinc-400">Head Office</div>

          <div className="font-medium">Status</div>
          <div className="text-zinc-600 dark:text-zinc-400">Authenticated</div>

          <div className="font-medium">Language</div>
          <div className="text-zinc-600 dark:text-zinc-400">English</div>
        </div>

        <div className="mt-6 border border-zinc-200 dark:border-zinc-700 rounded-md">
          <div className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-700 font-semibold text-sm text-zinc-700 dark:text-zinc-300 p-3 border-b dark:border-zinc-600">
            <div>Role</div>
            <div>Description</div>
          </div>
          <div className="grid grid-cols-2 text-sm text-zinc-700 dark:text-zinc-200 p-3">
            <div>Super user</div>
            <div>This role provides all application permissions.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
