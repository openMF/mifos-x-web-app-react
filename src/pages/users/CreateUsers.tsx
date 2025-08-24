import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";

import { StaffApi, UsersApi, type GetUsersTemplateResponse, type StaffData } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const userApi = new UsersApi(getConfiguration());
const staffApi = new StaffApi(getConfiguration());

const CreateUsers = () => {
    const [users, setUsers] = useState<GetUsersTemplateResponse>();
    const [staff, setStaff] = useState<StaffData[] | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        passwordNeverExpiers: false,
        sendPasswordToEmail: true,
        office: '',
        staff: '',
        roles: ''
    });

    // fetch template for offices, roles, etc.
    useEffect(() => {
        const fetchUserTemplate = async () => {
            try {
                const res = await userApi.template22();
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch user template", err);
            }
        };
        fetchUserTemplate();
    }, []);

    // fetch staff when office changes
    useEffect(() => {
        const fetchStaff = async () => {
            if (!formData.office) return;
            try {
                const response = await staffApi.retrieveAll16();
                setStaff(response.data || []);
            } catch (err) {
                console.error("Failed to fetch staff", err);
            }
        };
        fetchStaff();
    }, [formData.office]);

    const navigate = useNavigate();

    return (
        <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">

            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Users", href: "/users" },
                    { label: "Create Users", current: true }
                ]}
            />

            <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6">Create User</h2>
                <form className="space-y-6">
                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Username *</Label>
                            <Input placeholder="Enter username" className="w-full" />
                        </div>
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Email *</Label>
                            <Input placeholder="Enter email" className="w-full" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>First Name *</Label>
                            <Input placeholder="Enter First Name" className="w-full" />
                        </div>
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Last Name *</Label>
                            <Input placeholder="Enter Last Name" className="w-full" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] flex items-center gap-2">
                            <Checkbox id="manual-entries-1" />
                            <Label htmlFor="manual-entries-1">Password never expires</Label>
                        </div>
                        <div className="w-full md:w-[48%] flex items-center gap-2">
                            <Checkbox id="manual-entries-2" />
                            <Label htmlFor="manual-entries-2">Send password to email address</Label>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Office *"
                            selectValue={formData.office}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, office: value }))
                            }
                            selectPlaceholder="Select office"
                            selectOptions={
                                (users?.allowedOffices || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.name!
                                    }))
                            }
                        />
                        <AppSelect
                            selectLabel="Staff *"
                            selectValue={formData.staff}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, staff: value }))
                            }
                            selectPlaceholder="Select staff"
                            selectOptions={
                                (staff || [])
                                    .filter((option) => option.officeId?.toString() === formData.office)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.displayName!
                                    }))
                            }
                        />
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Roles *"
                            selectValue={formData.roles}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, roles: value }))
                            }
                            selectPlaceholder="Select role"
                            selectOptions={
                                (users?.availableRoles || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.name!
                                    }))
                            }
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => navigate('/appusers')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
                        >
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUsers;
