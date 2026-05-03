import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getDefaultRouteForRole } from "../config/permissions";
import { useCurrentUser } from "../hooks/useCurrentUser";
import AppShell from "../components/layout/AppShell";
import LoginPage from "../pages/auth/LoginPage";
import RequesterDashboardPage from "../pages/requester/RequesterDashboardPage";
import MyRequestsPage from "../pages/requester/MyRequestsPage";
import CreateRequestPage from "../pages/requester/CreateRequestPage";
import RequestDetailsPage from "../pages/requester/RequestDetailsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import PendingRecommendationsPage from "../pages/admin/PendingRecommendationsPage";
import AdminRecommendationReviewPage from "../pages/admin/AdminRecommendationReviewPage";
import GmDashboardPage from "../pages/gm/GmDashboardPage";
import PendingApprovalsPage from "../pages/gm/PendingApprovalsPage";
import GmApprovalReviewPage from "../pages/gm/GmApprovalReviewPage";
import CeoDashboardPage from "../pages/ceo/CeoDashboardPage";
import PendingAuthorizationsPage from "../pages/ceo/PendingAuthorizationsPage";
import CeoAuthorizationReviewPage from "../pages/ceo/CeoAuthorizationReviewPage";
import SystemAdminDashboardPage from "../pages/system-admin/SystemAdminDashboardPage";
import UsersPage from "../pages/system-admin/UsersPage";
import DepartmentsPage from "../pages/system-admin/DepartmentsPage";
import SettingsPage from "../pages/system-admin/SettingsPage";
import ReportsPage from "../pages/system-admin/ReportsPage";
import NotificationsPage from "../pages/system-admin/NotificationsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { protectedRoutes } from "./routeConfig";

function RoleRedirect() {
  const currentUser = useCurrentUser();
  // Root "/" becomes a smart redirect based on the user's role.
  return (
    <Navigate
      to={getDefaultRouteForRole(currentUser?.role)}
      replace
    />
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public login route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Everything below this point requires an authenticated session */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<RoleRedirect />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Requester routes */}
            <Route element={<RoleRoute allowedRoles={protectedRoutes.requester} />}>
              <Route path="/dashboard" element={<RequesterDashboardPage />} />
              <Route path="/requests" element={<MyRequestsPage />} />
              <Route path="/requests/new" element={<CreateRequestPage />} />
              <Route path="/requests/:requestId/edit" element={<CreateRequestPage />} />
              <Route path="/requests/:requestId" element={<RequestDetailsPage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<RoleRoute allowedRoles={protectedRoutes.admin} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route
                path="/admin/recommendations"
                element={<PendingRecommendationsPage />}
              />
              <Route
                path="/admin/recommendations/:requestId"
                element={<AdminRecommendationReviewPage />}
              />
              <Route path="/admin/overdue" element={<PendingRecommendationsPage />} />
            </Route>

            {/* GM routes */}
            <Route element={<RoleRoute allowedRoles={protectedRoutes.gm} />}>
              <Route path="/gm/dashboard" element={<GmDashboardPage />} />
              <Route path="/gm/approvals" element={<PendingApprovalsPage />} />
              <Route
                path="/gm/approvals/:requestId"
                element={<GmApprovalReviewPage />}
              />
            </Route>

            {/* CEO routes */}
            <Route element={<RoleRoute allowedRoles={protectedRoutes.ceo} />}>
              <Route path="/ceo/dashboard" element={<CeoDashboardPage />} />
              <Route
                path="/ceo/authorizations"
                element={<PendingAuthorizationsPage />}
              />
              <Route
                path="/ceo/authorizations/:requestId"
                element={<CeoAuthorizationReviewPage />}
              />
            </Route>

            {/* System Admin routes */}
            <Route
              element={<RoleRoute allowedRoles={protectedRoutes.systemAdmin} />}
            >
              <Route
                path="/system/dashboard"
                element={<SystemAdminDashboardPage />}
              />
              <Route path="/system/users" element={<UsersPage />} />
              <Route path="/system/departments" element={<DepartmentsPage />} />
              <Route path="/system/settings" element={<SettingsPage />} />
              <Route path="/system/reports" element={<ReportsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
