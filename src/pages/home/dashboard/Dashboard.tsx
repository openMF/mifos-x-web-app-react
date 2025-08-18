import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import ClientTrendsBar from "./client-trends-bar/ClientTrendsBar";
import AmountDisbursedPie from "./amount-disbursed-pie/AmountDisbursedPie";
import AmountCollectedPie from "./amount-collected-pie/AmountCollectedPie";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

const Dashboard = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">

      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Dashboard", current: true }
        ]}
      />

      <Card className="p-6 space-y-8">
        {/* Search Activity */}
        <CardContent className="p-0">
          <div className="w-full max-w-md flex flex-col gap-1 flex-1">
            <Label htmlFor="search">Search Activity</Label>
            <Input id="search" placeholder="Search Activity" />
            {/* Optionally add autocomplete logic here */}
          </div>
        </CardContent>

        {/* Client Trends */}
        <div className="w-full">
          <ClientTrendsBar />
        </div>

        {/* Disbursed & Collected Pie Charts */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <AmountDisbursedPie />
          </div>
          <div className="flex-1">
            <AmountCollectedPie />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
