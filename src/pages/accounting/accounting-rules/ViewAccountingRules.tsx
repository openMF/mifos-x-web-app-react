import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

import { getConfiguration } from "@/lib/fineract-openapi";
import { AccountingRulesApi, type AccountingRuleData } from "@/fineract-api";

//accounting API
const accountingRuleApi = new AccountingRulesApi(getConfiguration());

const ViewAccountingRules = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  //state to fetch accouting data
  const [accountingRule, setAccountingRule] = useState<AccountingRuleData>();

  useEffect(() => {

    const fetchAccountingRule = async () => {
      try {
        const response = await accountingRuleApi.retreiveAccountingRule(Number(id));
        setAccountingRule(response.data);
      } catch (err) {
        console.error("Failed to fetch Accounting rules data", err);
      }
    };

    fetchAccountingRule();
  }, [id]);

    const handleDelete = async () => {

    try {
      await accountingRuleApi.deleteAccountingRule(Number(id));
      navigate("/accounting/accounting-rules");
    } catch (err) {
      console.log("Failed to delete accounting rules", err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Accounting" },
          { label: "Closing Entries", href: "/accounting/closing-entries" },
          { label: `${accountingRule?.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex mb-6 gap-3">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/accounting/accounting-rules${accountingRule?.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete
          </Button>

        </div>
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Manage Accounting Rule
        </h2>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Office</div>
          <div className="text-zinc-600 dark:text-zinc-400">{accountingRule?.officeName}</div>

          <div className="font-medium">Description</div>
          <div className="text-zinc-600 dark:text-zinc-400">{accountingRule?.description}</div>

          <div className="font-medium">Multiple Debit Entries Allowed </div>
          <div className="text-zinc-600 dark:text-zinc-400">{accountingRule?.allowMultipleDebitEntries ? "true" : "false"}</div>

          <div className="font-medium">Multiple Credit Entries Allowed </div>
          <div className="text-zinc-600 dark:text-zinc-400">{accountingRule?.allowMultipleCreditEntries ? "true" : "false"}</div>

          <div className="font-medium">Debit Account Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {accountingRule?.debitAccounts?.length
              ? accountingRule.debitAccounts
                .map(acc => `${acc.name} (${acc.glCode})`)
                .join(", ")
              : "-"}
          </div>

          <div className="font-medium">Credit Account Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {accountingRule?.creditAccounts?.length
              ? accountingRule.creditAccounts
                .map(acc => `${acc.name} (${acc.glCode})`)
                .join(", ")
              : "-"}
          </div>


        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate("/accounting/accounting-rules")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewAccountingRules;
