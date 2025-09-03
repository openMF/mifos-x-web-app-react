import { useNavigate, useParams } from "react-router-dom";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import { Button } from "@/components/ui/button";

const UndoApprovalSharesAccount = () => {
  const { clientId, sharesAccountId } = useParams();
  const navigate = useNavigate();

  const backToAccount = () => {
    if (clientId && sharesAccountId) {
      navigate(-1);
    } else if (clientId) {
      navigate(`/clients/${clientId}/shares`);
    } else {
      navigate(-1);
    }
  };

  const onSubmit = () => {
    console.log("Undo approval of shares account:", sharesAccountId);
    backToAccount();
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Clients", href: "/clients" },
          { label: "Shares", href: clientId ? `/clients/${clientId}/shares` : "/clients" },
          { label: "Undo Approval", current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Undo Approval</h2>

          <p className="text-center text-base md:text-lg mb-8">
            Are you sure you want to undo approval of shares account with ID:{" "}
            <strong>{sharesAccountId}</strong> ?
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={backToAccount}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onSubmit}>
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UndoApprovalSharesAccount;
