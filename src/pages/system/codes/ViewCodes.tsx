import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { CodesApi, type GetCodesResponse } from "@/fineract-api"
import { getConfiguration } from "@/lib/fineract-openapi"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

const codesApi = new CodesApi(getConfiguration());

const ViewCodes = () => {
    const { id } = useParams();
    const [codes, setCodes] = useState<GetCodesResponse | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const res = await codesApi.retrieveCode(Number(id));
                setCodes(res.data);
            } catch (err) {
                console.log("Could not fetch code data", err);
            }
        };
        fetchCodes();
    }, [id]);

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "System", href: "/system" },
                    { label: "Codes", current: true },
                ]}
            />

            <div className="flex justify-between items-center mb-6">
                <Button
                    className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
                    onClick={() => setShowForm(true)}
                >
                    <Plus className="mr-2" /> Add Code Value
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
                <h2 className="font-bold">{codes?.name}</h2>

                {showForm && (
                    <div className="grid grid-cols-6 gap-4 items-center border-t pt-4">
                        {/* Name */}
                        <div className="col-span-2">
                            <Input placeholder="Name*" />
                        </div>

                        {/* Description */}
                        <div className="col-span-2">
                            <Input placeholder="Description" />
                        </div>

                        {/* Position */}
                        <div>
                            <Input type="number" defaultValue={0} />
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-2">
                            <Checkbox id="active" />
                            <label htmlFor="active" className="text-sm">
                                Active
                            </label>
                        </div>

                        {/* Action buttons */}
                        <div className="col-span-6 flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                                <Plus className="mr-1 h-4 w-4" /> Add
                            </Button>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewCodes;
