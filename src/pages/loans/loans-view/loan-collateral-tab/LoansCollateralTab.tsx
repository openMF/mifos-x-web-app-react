import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LoansCollateralTab = () => {
  const { groupId, loanId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="bg-transparent">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Loan Collateral Details
        </h3>
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none"
          onClick={() =>
            navigate(`/groups/${groupId}/loans-accounts/${loanId}/loan-collateral/add`)
          }
        >
          Add Collateral
        </Button>
      </div>
    </div>
  );
};

export default LoansCollateralTab;
