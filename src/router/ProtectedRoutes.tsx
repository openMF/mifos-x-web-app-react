import { Outlet, Navigate } from "react-router-dom";

const ProtectedRoutes = () => {
  const token = localStorage.getItem("mifosToken");
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoutes;