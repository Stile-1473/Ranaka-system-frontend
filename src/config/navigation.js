import {
  Bell,
  Building2,
  ClipboardCheck,
  FileClock,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCircle2,
  UserCog,
} from "lucide-react";
import { USER_ROLES } from "./constants";

// Sidebar links grouped by role so the UI shell stays role-aware without
// hardcoded conditionals inside the sidebar component.
export const navigationByRole = {
  [USER_ROLES.REQUESTER]: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Requests", to: "/requests", icon: FileText },
    { label: "Create Request", to: "/requests/new", icon: ClipboardCheck },
  ],
  [USER_ROLES.ADMIN]: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Recommendations", to: "/admin/recommendations", icon: ClipboardCheck },
    { label: "Overdue", to: "/admin/overdue", icon: FileClock },
  ],
  [USER_ROLES.GM]: [
    { label: "Dashboard", to: "/gm/dashboard", icon: LayoutDashboard },
    { label: "Approvals", to: "/gm/approvals", icon: ClipboardCheck },
  ],
  [USER_ROLES.CEO]: [
    { label: "Dashboard", to: "/ceo/dashboard", icon: LayoutDashboard },
    { label: "Authorizations", to: "/ceo/authorizations", icon: ShieldCheck },
  ],
  [USER_ROLES.SYSTEM_ADMIN]: [
    { label: "Dashboard", to: "/system/dashboard", icon: LayoutDashboard },
    { label: "Users", to: "/system/users", icon: UserCog },
    { label: "Departments", to: "/system/departments", icon: Building2 },
    { label: "Settings", to: "/system/settings", icon: Settings },
    { label: "Reports", to: "/system/reports", icon: FileText },
  ],
};

// Secondary links available regardless of the current role.
export const secondaryNavigation = [
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Profile", to: "/profile", icon: UserCircle2 },
];
