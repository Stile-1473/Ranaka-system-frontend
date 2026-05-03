import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingScreen from "../components/feedback/LoadingScreen";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute() {
  const location = useLocation();
  const { hasBootstrapped, isAuthenticated } = useAuth();

  if (!hasBootstrapped) {
    // Wait until the auth layer finishes restoring or rejecting the saved session.
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login and remember where they were headed.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
