import { Bell, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import AppCommandSearch from "./AppCommandSearch";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationQueryStore } from "../../stores/query/notificationQueryStore";
import { useUiStore } from "../../stores/base/createUiStore";

function AppHeader({ title, subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const unreadCount = useNotificationQueryStore((state) => state.unreadCount);
  const openSidebar = useUiStore((state) => state.openSidebar);
  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  return (
    <header className="fixed left-4 right-4 top-4 z-20 rounded-[1.35rem] border border-white/10 bg-slate-950/40 px-4 py-3.5 shadow-[0_22px_70px_-42px_rgba(2,6,23,0.92)] backdrop-blur-2xl lg:sticky lg:left-auto lg:right-auto lg:top-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={openSidebar}
            className="glass-control rounded-full p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-slate-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-50">{title}</p>
            {subtitle ? (
              <p className="hidden truncate text-xs text-slate-500 xl:block">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <AppCommandSearch />

          <Link
            to="/notifications"
            className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition ${
              location.pathname === "/notifications"
                ? "border-emerald-400/35 bg-emerald-500/16 text-emerald-300 shadow-[0_0_22px_rgba(34,197,94,0.22)]"
                : "border-white/10 bg-white/6 text-slate-300 hover:bg-white/10 hover:text-slate-50"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
            <span
              className={`absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                unreadCount > 0
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {unreadCount}
            </span>
          </Link>

          <Button
            variant="secondary"
            className="gap-2 border-white/10 bg-white/6 px-3 py-2 text-slate-300 hover:bg-rose-500/14 hover:text-rose-100"
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
