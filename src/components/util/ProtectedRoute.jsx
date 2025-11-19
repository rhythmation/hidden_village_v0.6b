import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ isLoggedIn }) {
  const { loading } = useAuth();
  if (loading) return <div>Loading...</div>;

  return isLoggedIn ? <Outlet /> : <Navigate to="/signIn" replace />;
}
