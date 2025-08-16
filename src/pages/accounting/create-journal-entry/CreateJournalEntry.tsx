import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppSelect from "@/components/custom/select/AppSelect";

import { getConfiguration } from "@/lib/fineract-openapi";
import { CurrencyApi, GeneralLedgerAccountApi, JournalEntriesApi, OfficesApi, PaymentTypeApi, type CurrencyData, type GetGLAccountsResponse, type GetOfficesResponse, type GetPaymentTypeData } from "@/fineract-api";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faMinusCircle } from "@fortawesome/free-solid-svg-icons";

interface glAccounts {
    id: number;
    glAccountId: string;
    amount: string;
}

const journalEntryApi = new JournalEntriesApi(getConfiguration());
const officeApi = new OfficesApi(getConfiguration());
const currencyApi = new CurrencyApi(getConfiguration());
const paymentApi = new PaymentTypeApi(getConfiguration());
const glApi = new GeneralLedgerAccountApi(getConfiguration());

const CreateJournalEntry = () => {
    const navigate = useNavigate();

    const [offices, setOffices] = useState<GetOfficesResponse[] | null>(null);
    const [currencies, setCurrencies] = useState<CurrencyData[] | null>(null);
    const [paymentTypes, setPaymentTypes] = useState<GetPaymentTypeData[] | null>(null);
    const [glAccounts, setGlAccounts] = useState<GetGLAccountsResponse[]>([]);

    const [debits, setDebits] = useState<glAccounts[]>([
        { id: Date.now(), glAccountId: "", amount: "" }
    ]);

    const [credits, setCredits] = useState<glAccounts[]>([
        { id: Date.now() + 1, glAccountId: "", amount: "" }
    ]);

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [officesRes, currenciesRes, paymentTypesRes, glAccountsRes] = await Promise.all([
                    officeApi.retrieveOffices(),
                    currencyApi.retrieveCurrencies(),
                    paymentApi.getAllPaymentTypes(),
                    glApi.retrieveAllAccounts(
                        undefined,    // type
                        undefined,    // searchParam
                        1,            // usage
                        true,         // manualEntriesAllowed
                        false         // disabled
                    )
                ]);
                setOffices(officesRes.data);
                setCurrencies(currenciesRes.data.selectedCurrencyOptions ?? []);
                setPaymentTypes(paymentTypesRes.data);
                setGlAccounts(glAccountsRes.data);
            } catch (err) {
                console.log("Failed to fetch Dropdown Data", err);
            }
        };
        fetchDropdowns();
    }, []);

    const handleDebitChange = (index: number, field: keyof glAccounts, value: string) => {
        const updated = [...debits];
        (updated[index][field] as string) = value;
        setDebits(updated);


    };

    const handleCreditChange = (index: number, field: keyof glAccounts, value: string) => {
        const updated = [...credits];
        (updated[index][field] as string) = value;
        setCredits(updated);
    };

    const addDebit = () => {
        setDebits(prev => [...prev, { id: Date.now(), glAccountId: "", amount: "" }]);
    };

    const addCredit = () => {
        setCredits(prev => [...prev, { id: Date.now(), glAccountId: "", amount: "" }]);
    };

    const removeDebit = (id: number) => {
        setDebits(prev => prev.filter(d => d.id !== id));
    };

    const removeCredit = (id: number) => {
        setCredits(prev => prev.filter(c => c.id !== id));
    };

    const [formData, setFormData] = useState({
        office: '',
        currency: '',
        refNo: '',
        date: '',
        paymentType: '',
        accNo: '',
        chequeNo: '',
        routingCode: '',
        receiptNo: '',
        bankNo: '',
        comments: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.office || !formData.currency || debits.length === 0 || credits.length === 0 || !formData.date) {
            alert("Please fill all required fields.");
            return;
        }

        const payload = {
            officeId: parseInt(formData.office),
            currencyCode: formData.currency,
            transactionDate: formData.date, 
            dateFormat: 'yyyy-MM-dd',
            locale: 'en',
            debits: debits.map(d => ({
                glAccountId: parseInt(d.glAccountId),
                amount: parseFloat(d.amount)
            })),
            credits: credits.map(c => ({
                glAccountId: parseInt(c.glAccountId),
                amount: parseFloat(c.amount)
            })),
        };

        try {
            await journalEntryApi.createGLJournalEntry(undefined, payload);
            alert("Journal entry created successfully!");
            navigate("/accounting/chart-of-accounts");
        } catch (err) {
            alert("Failed to create journal entry");
            console.log("Failed to create journal entry", err);
        }
    };

    return (
        <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">

            <AppBreadCrumbs
                items={[
                    { label: "Home", href: "/home" },
                    { label: "Accounting", href:"/accounting" },
                    { label: "Journal Entries" },
                    { label: "Create", current: true }
                ]}
            />

            <div className="bg-white p-8 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">Create Journal Entry</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Office & Currency */}
                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Office *"
                            selectValue={formData.office}
                            selectOnChange={(value) => {
                                setFormData(prev => ({ ...prev, office: value }))
                            }}
                            selectPlaceholder="Select office"
                            selectOptions={
                                (offices || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.name!
                                    }))
                            }
                        />
                        <AppSelect
                            selectLabel="Currency *"
                            selectValue={formData.currency}
                            selectOnChange={(value) => {
                                setFormData(prev => ({ ...prev, currency: value }))
                            }}
                            selectPlaceholder="Select currency"
                            selectOptions={
                                (currencies || [])
                                    .filter((option) => option.code !== undefined)
                                    .map((option) => ({
                                        id: option.code!,
                                        name: option.displayLabel!
                                    }))
                            }
                        />
                    </div>

                    {/* Debit Rows */}
                    {debits.map((debit, index) => (
                        <div className="flex items-end gap-4" key={debit.id}>
                            <AppSelect
                                selectLabel="Affected GL Entry (Debit) *"
                                selectValue={debit.glAccountId}
                                selectOnChange={(value) => {
                                    handleDebitChange(index, "glAccountId", value)
                                }}
                                selectPlaceholder="Select GL"
                                selectOptions={
                                    (glAccounts || [])
                                        .filter((option) => option.id !== undefined)
                                        .map((option) => ({
                                            id: option.id!,
                                            name: `${option.name} (${option.glCode})`
                                        }))
                                }
                            />
                            <div className="w-[48%] space-y-2">
                                <Label>Debit Amount *</Label>
                                <Input
                                    value={debit.amount}
                                    onChange={e => handleDebitChange(index, "amount", e.target.value)}
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div className="pb-1">
                                {index === 0 ? (
                                    <FontAwesomeIcon
                                        icon={faCirclePlus}
                                        className="text-blue-600 cursor-pointer text-2xl"
                                        onClick={addDebit}
                                    />
                                ) : (
                                    <FontAwesomeIcon
                                        icon={faMinusCircle}
                                        className="text-red-500 cursor-pointer text-2xl"
                                        onClick={() => removeDebit(debit.id)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Credit Rows */}
                    {credits.map((credit, index) => (
                        <div className="flex items-end gap-4" key={credit.id}>
                            <AppSelect
                                selectLabel="Affected GL Entry (Credit) *"
                                selectValue={credit.glAccountId}
                                selectOnChange={(value) =>
                                    handleCreditChange(index, "glAccountId", value)
                                }
                                selectPlaceholder="Select GL"
                                selectOptions={
                                    (glAccounts || [])
                                        .filter((option) => option.id !== undefined)
                                        .map((option) => ({
                                            id: option.id!,
                                            name: `${option.name} (${option.glCode})`,
                                        }))
                                }
                            />
                            <div className="w-[48%] space-y-2">
                                <Label>Credit Amount *</Label>
                                <Input
                                    value={credit.amount}
                                    onChange={(e) => handleCreditChange(index, "amount", e.target.value)}
                                    placeholder="Enter amount"
                                />

                            </div>
                            <div className="pb-1">
                                {index === 0 ? (
                                    <FontAwesomeIcon
                                        icon={faCirclePlus}
                                        className="text-blue-600 cursor-pointer text-2xl"
                                        onClick={addCredit}
                                    />
                                ) : (
                                    <FontAwesomeIcon
                                        icon={faMinusCircle}
                                        className="text-red-500 cursor-pointer text-2xl"
                                        onClick={() => removeCredit(credit.id)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Additional Fields */}
                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Reference Number</Label>
                            <Input
                                placeholder="Enter reference number"
                                value={formData.refNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, refNo: e.target.value }))}
                            />
                        </div>
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Transaction Date *</Label>
                            <Input
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                type="date"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <AppSelect
                            selectLabel="Payment Type"
                            selectValue={formData.paymentType}
                            selectOnChange={(value) =>
                                setFormData((prev) => ({ ...prev, paymentType: value }))
                            }
                            selectPlaceholder="Select payment type"
                            selectOptions={
                                (paymentTypes || [])
                                    .filter((option) => option.id !== undefined)
                                    .map((option) => ({
                                        id: option.id!,
                                        name: option.name!,
                                    }))
                            }
                        />
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Account Number</Label>
                            <Input
                                placeholder="Enter account number"
                                value={formData.accNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, accNo: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* More Fields */}
                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Cheque Number</Label>
                            <Input
                                placeholder="Enter cheque number"
                                value={formData.chequeNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, chequeNo: e.target.value }))}
                            />
                        </div>
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Routing Code</Label>
                            <Input
                                placeholder="Enter routing code"
                                value={formData.routingCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, routingCode: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Receipt Number</Label>
                            <Input
                                placeholder="Enter receipt number"
                                value={formData.receiptNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, receiptNo: e.target.value }))}
                            />
                        </div>
                        <div className="w-full md:w-[48%] space-y-2">
                            <Label>Bank Number</Label>
                            <Input
                                placeholder="Enter bank number"
                                value={formData.bankNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, bankNo: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comments</Label>
                        <Input
                            placeholder="Enter comments"
                            value={formData.comments}
                            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/accounting/journal-entries/create")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#1074b9] hover:bg-[#1074c9] text-white">
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateJournalEntry;
