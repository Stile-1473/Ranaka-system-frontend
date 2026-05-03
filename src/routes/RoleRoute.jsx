import { Navigate, Outlet } from "react-router-dom";
import { getDefaultRouteForRole } from "../config/permissions";
import { useCurrentUser } from "../hooks/useCurrentUser";

function RoleRoute({ allowedRoles }) {
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // If the user is authenticated but opens the wrong role workspace,
    // send them back to the dashboard that matches their actual role.
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
