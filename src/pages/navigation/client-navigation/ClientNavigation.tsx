import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCircle } from "@fortawesome/free-solid-svg-icons";
import { ClientApi, type ClientData } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

interface ClientNavigationProps {
  clientId: number;
}

const clientApi = new ClientApi(getConfiguration());

const ClientNavigation = ({ clientId }: ClientNavigationProps) => {
    const [client, setClient] = useState<ClientData | undefined>();

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await clientApi.retrieveAll21(clientId);
        setClient(res.data as ClientData); 
      } catch (err) {
        console.error("Failed to fetch client details", err);
      }
    };
    fetchClient();
  }, [clientId]);

  if (!client) return <p className="text-gray-500">Loading client info...</p>;

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <FontAwesomeIcon icon={faUser} size="2x" className="text-gray-700 dark:text-gray-200" />
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {client.displayName}
            <FontAwesomeIcon icon={faCircle} className="text-green-500" title="Active" />
          </h2>
          <p className="text-gray-500">
            Account No: <span className="font-medium">{client.accountNo}</span> | External ID: <span className="font-medium">{typeof client.externalId || "N/A"}</span>
          </p>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-2 gap-y-3">
          <div className="font-medium">First Name:</div>
          <div>{client.firstname || "-"}</div>

          <div className="font-medium">Middle Name:</div>
          <div>{client.middlename || "-"}</div>

          <div className="font-medium">Last Name:</div>
          <div>{client.lastname || "-"}</div>

          <div className="font-medium">Date of Birth:</div>
          <div>{client.dateOfBirth || "-"}</div>

          <div className="font-medium">Mobile Number:</div>
          <div>{client.mobileNo || "-"}</div>

          <div className="font-medium">Activation Date:</div>
          <div>{client.activationDate || "-"}</div>

          <div className="font-medium">Associated Office:</div>
          <div>{client.officeName || "-"}</div>

          <div className="font-medium">Associated Staff:</div>
          <div>{client.staffName || "-"}</div>
        </div>

        {/* Tabs for Accounts & Groups */}
        <div className="pt-8">
          <h3 className="text-lg font-semibold mb-3">Loan Accounts</h3>
          <p className="text-gray-500">[Loan account table goes here]</p>

          <h3 className="text-lg font-semibold mt-6 mb-3">Savings Accounts</h3>
          <p className="text-gray-500">[Savings account table goes here]</p>

          <h3 className="text-lg font-semibold mt-6 mb-3">Share Accounts</h3>
          <p className="text-gray-500">[Share account table goes here]</p>

          <h3 className="text-lg font-semibold mt-6 mb-3">Group Memberships</h3>
          <p className="text-gray-500">[Group membership info goes here]</p>
        </div>
      </div>
    </div>
  );
};

export default ClientNavigation;
