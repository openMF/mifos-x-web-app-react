import MifosLogo from "@/assets/images/MifosX_logo.png";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Gauge, Send, Check, Layers2, Bell, RefreshCcw, Plus, Network, Keyboard,
  CircleHelp, LogOut, Cog, User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel
} from "@/components/ui/sidebar";

export const AppSidebar = () => {
  const navigate = useNavigate();

  const handleHome = () => {
    navigate("/home");
  };

  const handleClick = (page: string) => {
    navigate(`/${page}`);
  }

  return (
    <Sidebar className="w-64 h-screen flex flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-800">
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center space-y-3 pt-5">
          <img
            src={MifosLogo}
            alt="Mifos X"
            className="h-20 cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={handleHome}
          />
          <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-200">Mifos X</h1>

          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow">
            <User className="w-6 h-6 text-gray-500 dark:text-gray-300" />
          </div>
          <p className="text-base text-gray-500 dark:text-gray-400">default / mifos</p>

          <div className="flex space-x-4 mt-2">
            <Cog className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-primary cursor-pointer" />
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-red-500 cursor-pointer" />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pt-4 text-base font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Frequently Accessed
          </SidebarGroupLabel>
          <SidebarMenu></SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pt-4 pb-4 text-base font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Main Items
          </SidebarGroupLabel>
          <SidebarMenu>
            {[
              { icon: <Gauge />, label: "Dashboard", route: "dashboard" },
              { icon: <Send />, label: "Navigation", route: "navigation" },
              { icon: <Check />, label: "Checker Inbox and Tasks", route: "checker-inbox-and-tasks/checker-inbox" },
              { icon: <Layers2 />, label: "Individual Collection Sheet", route: "individual-collection-sheet" },
              { icon: <Bell />, label: "Notifications", route: "notifications" },
              { icon: <RefreshCcw />, label: "Frequent Postings", route: "accounting/journal-entries/frequent-postings" },
              { icon: <Plus />, label: "Create Journal Entry", route: "accounting/journal-entries/create" },
              { icon: <Network />, label: "Chart of Accounts", route: "accounting/chart-of-accounts" },
            ].map(({ icon, label, route }) => (
              <SidebarMenuItem key={label} className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-lg font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                    onClick={() => handleClick(route)}
                  >
                    {icon}
                    <p>{label}</p>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            <SidebarMenuItem className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                >
                  <Keyboard />
                  <p>Keyboard Shortcuts</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                >
                  <CircleHelp />
                  <p>
                    <a href="https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual" target="_blank" rel="noopener noreferrer">
                      Help
                    </a>
                  </p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
