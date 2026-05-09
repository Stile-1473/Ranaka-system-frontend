import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "../navigation/AppSidebar";
import AppHeader from "../navigation/AppHeader";
import PageTransition from "../feedback/PageTransition";

const pageTitles = {
  // Central page title map so the shared header always knows what to display.
  "/dashboard": {
    title: "My Workspace",
    subtitle: "See what needs your action and follow your requests.",
  },
  "/requests": {
    title: "My Requests",
    subtitle: "Check drafts, corrections, and submitted requests in one place.",
  },
  "/requests/new": {
    title: "New Request",
    subtitle: "Add the details needed for review and approval.",
  },
  "/admin/dashboard": {
    title: "Admin Dashboard",
    subtitle: "Prioritize recommendations and catch overdue approvals early.",
  },
  "/admin/recommendations": {
    title: "Pending Recommendations",
    subtitle: "Review submitted requests and move valid items to management approval.",
  },
  "/gm/dashboard": {
    title: "GM Dashboard",
    subtitle: "Keep management approvals moving and visible.",
  },
  "/gm/approvals": {
    title: "Pending GM Approvals",
    subtitle: "Approve, reject, or return requests waiting on management action.",
  },
  "/ceo/dashboard": {
    title: "CEO Dashboard",
    subtitle: "See the executive queue, critical items, and approval health.",
  },
  "/ceo/authorizations": {
    title: "Pending Authorizations",
    subtitle: "Finalize high-confidence requests with a clear executive view.",
  },
  "/system/dashboard": {
    title: "System Oversight",
    subtitle: "Monitor the full platform, users, settings, and performance.",
  },
  "/system/users": {
    title: "User Management",
    subtitle: "Control access, roles, and platform readiness across the organisation.",
  },
  "/system/departments": {
    title: "Department Management",
    subtitle: "Keep business ownership clean for requests, reporting, and accountability.",
  },
  "/system/settings": {
    title: "Workflow Settings",
    subtitle: "Tune SLA timing, reminders, and operational behavior without code changes.",
  },
  "/system/reports": {
    title: "Reports",
    subtitle: "Turn workflow data into operational insight for leadership.",
  },
  "/notifications": {
    title: "Notifications",
    subtitle: "Stay on top of live events and unread activity across the workflow.",
  },
  "/profile": {
    title: "My Profile",
    subtitle: "Keep your personal details accurate and your account secure.",
  },
};

function AppShell() {
  const location = useLocation();
  const getPageMeta = () => {
    if (location.pathname.startsWith("/admin/recommendations/")) {
      return {
        title: "Review Recommendation",
        subtitle: "Inspect the request in full and decide whether it should move forward.",
      };
    }

    if (location.pathname.startsWith("/gm/approvals/")) {
      return {
        title: "Review GM Approval",
        subtitle: "Inspect the request in full and decide whether it should move to executive authorization.",
      };
    }

    if (location.pathname.startsWith("/ceo/authorizations/")) {
      return {
        title: "Review CEO Authorization",
        subtitle: "Inspect the request in full and decide whether it should be authorized, returned, or rejected.",
      };
    }

    if (location.pathname.startsWith("/requests/") && location.pathname.endsWith("/edit")) {
      return {
        title: "Edit Request",
        subtitle: "Make the needed changes before saving or resubmitting.",
      };
    }

    if (
      location.pathname.startsWith("/requests/") &&
      location.pathname !== "/requests/new"
    ) {
      return {
        title: "Request Details",
        subtitle: "See where the request is and what happens next.",
      };
    }

    return (
      pageTitles[location.pathname] || {
        title: "Ranaka Workspace",
        subtitle: "A structured approval experience built for clarity and control.",
      }
    );
  };

  const pageMeta = getPageMeta();

  return (
    <div className="app-shell">
      {/* Shared sidebar across all authenticated pages */}
      <AppSidebar />
      <main className="relative z-10 min-h-screen lg:pl-[8.5rem]">
        <div className="mx-auto max-w-[1700px] px-4 pb-4 pt-24 lg:px-6 lg:py-6">
          {/* Sticky role-aware header */}
          <AppHeader title={pageMeta.title} subtitle={pageMeta.subtitle} />
          <div className="mt-6">
            <PageTransition>
              {/* Child page route renders here */}
              <Outlet />
            </PageTransition>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppShell;
