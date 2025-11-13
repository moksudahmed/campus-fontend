import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/authProvider";

export const ProtectedRoute = () => {
  const { token } = useAuth();

  if (!token) {
    // Not authenticated → redirect to login
    return <Navigate to="/login" replace />;
  }

  // Authenticated → render nested routes
  return <Outlet />;
};
