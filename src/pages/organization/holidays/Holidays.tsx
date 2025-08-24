import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  OfficesApi,
  type GetOfficesResponse,
  type GetHolidaysResponse,
  HolidaysApi,
} from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import { Plus } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const holidayApi = new HolidaysApi(getConfiguration());
const officesApi = new OfficesApi(getConfiguration());

const Holidays = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<GetOfficesResponse[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [allHolidays, setAllHolidays] = useState<GetHolidaysResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // fetch offices on mount
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await officesApi.retrieveOffices();
        setOffices(res.data || []);
      } catch (err) {
        console.error("Failed to fetch offices", err);
      }
    };
    fetchOffices();
  }, []);

  // fetch holidays when office changes
  useEffect(() => {
    if (selectedOffice) {
      const fetchHolidays = async () => {
        try {
          const res = await holidayApi.retrieveAllHolidays(Number(selectedOffice));
          setAllHolidays(res.data);
        } catch (err) {
          console.error("Failed to fetch holidays", err);
        }
      };
      fetchHolidays();
    }
  }, [selectedOffice]);

  // filter holidays 
  const filteredHolidays = allHolidays.filter(
    (holiday) =>
      holiday.status?.value !== "Deleted" &&
      holiday.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <div className="flex justify-between items-center mb-6">
        <AppBreadCrumbs
          items={[
            { label: "Home", href: "/home" },
            { label: "Organization", href: "/organization" },
            { label: "Manage Holidays", current: true },
          ]}
        />
      </div>

      {/* filters + create holiday button */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <Input
          placeholder="Filter"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-[300px]"
        />

        <AppSelect
          selectLabel="Select Office"
          selectPlaceholder="Select Office"
          selectValue={selectedOffice}
          selectOnChange={(v) => setSelectedOffice(v)}
          selectOptions={offices.map((office) => ({
            id: office.id?.toString() || "",
            name: office.name || "",
          }))}
        />

        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          onClick={() => navigate("/organization/holidays/create")}
        >
          <Plus className="mr-2" />
          Create Holiday
        </Button>
      </div>

      {/* holidays table */}
      {selectedOffice && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
          <Table>
            <TableHeader>
              <TableRow className="text-base">
                <TableHead className="px-6 py-4">Holiday Name</TableHead>
                <TableHead className="px-6 py-4">Start Date</TableHead>
                <TableHead className="px-6 py-4">End Date</TableHead>
                <TableHead className="px-6 py-4">Repayments Scheduled To</TableHead>
                <TableHead className="px-6 py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.length > 0 ? (
                filteredHolidays.map((holiday, index) => (
                  <TableRow
                    key={holiday.id}
                    className={index % 2 === 0 ? "bg-white cursor-pointer" : "bg-gray-50 dark:bg-zinc-900"}
                    onClick={() => navigate(`/organization/holidays/${holiday.id}`)}
                  >
                    <TableCell className="px-6 py-4">{holiday.name || "—"}</TableCell>
                    <TableCell className="px-6 py-4">{holiday.fromDate}</TableCell>
                    <TableCell className="px-6 py-4">{holiday.toDate}</TableCell>
                    <TableCell className="px-6 py-4">{holiday.repaymentsRescheduledTo}</TableCell>
                    <TableCell className="px-6 py-4">{holiday.status?.value || "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    No holidays found for this office.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Holidays;
