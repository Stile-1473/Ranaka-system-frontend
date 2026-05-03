import { Bell, LogOut, Menu, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationQueryStore } from "../../stores/query/notificationQueryStore";
import { useUiStore } from "../../stores/base/createUiStore";

function AppHeader({ title, subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const unreadCount = useNotificationQueryStore((state) => state.unreadCount);
  const openSidebar = useUiStore((state) => state.openSidebar);
  const initials = `${currentUser?.firstName?.[0] || ""}${currentUser?.lastName?.[0] || ""}`.trim();

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  return (
    <header className="sticky top-4 z-20 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={openSidebar}
          className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[1.35rem] font-semibold tracking-[-0.02em] text-slate-900">
            {title}
          </p>
          <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 xl:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {currentUser?.role?.replaceAll("_", " ")}
              </p>
            </div>
          </div>

          <Link
            to="/notifications"
            className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
              location.pathname === "/notifications"
                ? "border-slate-300 bg-slate-100 text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
            <span
              className={`absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                unreadCount > 0
                  ? "bg-amber-500 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {unreadCount}
            </span>
          </Link>

          <Link
            to="/profile"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
              location.pathname === "/profile"
                ? "border-slate-300 bg-slate-100 text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <UserCircle2 className="h-4 w-4" />
            <span className="sr-only">Profile</span>
          </Link>

          <Button
            variant="secondary"
            className="gap-2 border-rose-200 px-3 py-2 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
