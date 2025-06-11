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
    navigate(`/${page}`)
  }


  return (
    <Sidebar className="w-64 bg-white shadow-md h-screen flex flex-col border-r">
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center space-y-3 pt-5">
          <img
            src={MifosLogo}
            alt="Mifos X"
            className="h-20 cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={handleHome}
          />
          <h1 className="text-3xl font-bold text-gray-700">Mifos X</h1>

          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shadow">
            <User className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-base text-gray-500">default / mifos</p>

          <div className="flex space-x-4 mt-2">
            <Cog className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
            <LogOut className="w-5 h-5 text-gray-600 hover:text-red-500 cursor-pointer" />
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pt-4 text-base font-semibold text-gray-400 uppercase tracking-wide">
            Frequently Accessed
          </SidebarGroupLabel>
          <SidebarMenu>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pt-4 pb-4 text-base font-semibold text-gray-400 uppercase tracking-wide">
            Main Items
          </SidebarGroupLabel>
          <SidebarMenu>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer overflow-y-hidden"
                >
                  <Gauge />
                  <p>Dashboard</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <Send />
                  <p>Navigation</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <Check />
                  <p>Checker Inbox and Tasks</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <Layers2 />
                  <p>Individual Collection Sheet</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <Bell />
                  <p>Notifications</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <RefreshCcw />
                  <p>Frequent Postings</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <Plus />
                  <p>Create Journal Entry</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                  onClick={() => handleClick("chart-of-accounts")}
                >
                  <Network />
                  <p>Chart of Accounts</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <Keyboard />
                  <p>Keyboard Shortcuts</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black hover:text-primary cursor-pointer"
                >
                  <CircleHelp />
                  <p><a href="https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual">Help</a></p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
