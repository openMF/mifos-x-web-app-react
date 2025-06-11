import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

const ProtectedRoutes = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoutes;
