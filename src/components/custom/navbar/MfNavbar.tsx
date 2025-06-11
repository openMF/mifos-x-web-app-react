// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar";

// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog"

import { Landmark,Banknote,ChartBar,Shield,Search,Bell,Moon } from 'lucide-react';
import Dropdown from "./Dropdown";


const MfNavbar = () => {
  return (
    <div className="flex flex-wrap justify-between items-center h-auto bg-[#1074b9] px-4 py-2 shadow-3xl text-base text-white gap-4">
      
      {/* Left - Menu & Sections */}
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <SidebarTrigger />

        <Dropdown
          name={<span className="flex items-center gap-2"><Landmark /> Institution</span>}
          options={["Clients", "Groups", "Centers", "Accounting"]}
        />
        <Dropdown
          name={<span className="flex items-center gap-2"><Banknote /> Accounting</span>}
          options={["Clients", "Groups", "Centers", "Accounting", "Reports", "Admin", "Self Service"]}
        />
        <Dropdown
          name={<span className="flex items-center gap-2"><ChartBar /> Reports</span>}
          options={["All", "Clients", "Loans", "Savings", "Funds", "Accounting", "XBRL"]}
        />
        <Dropdown
          name={<span className="flex items-center gap-2"><Shield /> Admin</span>}
          options={["Users", "Organization", "System", "Products", "Templates"]}
        />
      </div>

      {/* Right - Icons */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button className="hover:text-gray-200 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <Dropdown
          name={<span className="flex items-center gap-1">Language</span>}
          options={["English", "Spanish", "French", "Italian"]}
        />
        <button className="hover:text-gray-200 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="hover:text-gray-200 transition-colors">
          <Moon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MfNavbar;