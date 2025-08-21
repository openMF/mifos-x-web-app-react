import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#3498db] text-white">
      <h1 className="font-bold text-[10rem] leading-none">404</h1>
      <p className="text-xl mt-4">Oops.. Looks like this page doesn't exist.</p>
      <Button
        onClick={handleClick}
        className="mt-6 bg-white text-black font-semibold hover:bg-gray-100 cursor-pointer"
      >
        <ArrowLeft className="mr-1" />
        Back
      </Button>
    </div>
  );
};

export default NotFound;
