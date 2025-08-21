import { SidebarTrigger } from "@/components/ui/sidebar";

import DropDown from "@/components/custom/navbar/Dropdown";

import { Landmark, Banknote, ChartBar, Shield, Search, Bell, Moon, User, Sun } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";


const MfNavbar = () => {

  const navigate = useNavigate();

  const handleNavigate = (path?: string) => {
    if (!path || path.trim() === "") return;
    else if (path.startsWith("http")) {
      window.open(path, "_blank");
    } else {

      navigate(`/${path.trim()}`);
    }
  };

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }


  return (
    <div className="flex flex-wrap justify-between items-center h-auto bg-[#1074b9] px-4 py-2 shadow-3xl text-base text-white gap-4">

      {/* Left Menu & Sections */}
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <SidebarTrigger />

        <DropDown
          name={<span className="flex items-center gap-2"><Landmark /> Institution</span>}
          options={[
            { label: "Clients", path: "clients" },
            { label: "Groups", path: "groups" },
            { label: "Centers", path: "centers" },
            { label: "Accounting", path: "accounting" },
          ]}
          onSelect={handleNavigate}
        />
        <Button
          className="flex items-center gap-2 shadow-none bg-transparent hover:bg-[#0e6aa5] hover:text-white dark:text-white"
          onClick={() => navigate("/accounting")}
        ><Banknote /> Accounting</Button>
        <DropDown
          name={<span className="flex items-center gap-2"><ChartBar /> Reports</span>}
          options={[
            { label: "All", path: "reports" },
            { label: "Clients", path: "reports/client" },
            { label: "Loans", path: "reports/loan" },
            { label: "Savings", path: "reports/savings" },
            { label: "Funds", path: "reports/fund" },
            { label: "Accounting", path: "reports/accounting" },
          ]}
          onSelect={handleNavigate}
        />
        <DropDown
          name={<span className="flex items-center gap-2"><Shield /> Admin</span>}
          options={[
            { label: "Users", path: "appusers" },
            { label: "Organization", path: "organization" },
            { label: "System", path: "system" },
            { label: "Products", path: "products" },
            { label: "Templates", path: "templates" },
          ]}
          onSelect={handleNavigate}
        />
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button className="hover:text-gray-200 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <DropDown
          name={<span className="flex items-center gap-1">Language</span>}
          options={[
            { label: "English" },
            { label: "Spanish" },
            { label: "French" },
            { label: "Italian" },
          ]}
          onSelect={handleNavigate}
        />
        <Button
          variant="ghost"
          className="hover:text-gray-200 transition-colors hover:bg-transparent dark:hover:bg-transparent cursor-pointer">
          <Bell className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          className="hover:text-gray-200 transition-colors hover:bg-transparent dark:hover:bg-transparent cursor-pointer"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
        <DropDown
          name={<span className="flex items-center gap-2"><User /></span>}
          options={[
            { label: "Help", path: "https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manualsers" },
            { label: "Profile", path: "profile" },
            { label: "Settings", path: "settings" },
            { label: "Sign Out", path: "signout" },
          ]}
          onSelect={handleNavigate}
        />
      </div>
    </div>
  );
};

export default MfNavbar;