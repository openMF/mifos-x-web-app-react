import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { HolidaysApi, type PutHolidaysHolidayIdResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const holidayApi = new HolidaysApi(getConfiguration());

const EditHolidays = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [holiday, setHoliday] = useState<PutHolidaysHolidayIdResponse>();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    // useEffect(() => {
    //     const fetchHoliday = async () => {
    //         try {
    //             const res = await holidayApi.retrieveOne7(Number(id));
    //             setHoliday(res.data);
    //             setFormData({
    //                 name: res.data.name ?? "",
    //                 description: res.data.description ?? "",
    //             });
    //         } catch (err) {
    //             console.error("Failed to fetch holiday", err);
    //         }
    //     };
    //     if (id) fetchHoliday();
    // }, [id]);


    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Organization" },
                    { label: "Manage Holidays", href: "/organization/holidays" },
                    { label: "ID", href: `/organization/holidays/${navigate(-1)}` },
                    { label: "Edit", current: true },
                ]}
            />

            <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6">Edit Office</h2>

                <form className="space-y-6" >
                    {/*Name */}
                    <div className="w-full space-y-2">
                        <Label>Name*</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleChange("officeName", e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="w-full space-y-2">
                        <Label>Description</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => handleChange("officeName", e.target.value)}
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/organization/holidays/4")}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
                        >
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditHolidays;
