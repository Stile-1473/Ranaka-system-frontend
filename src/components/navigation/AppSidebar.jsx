import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { navigationByRole, secondaryNavigation } from "../../config/navigation";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUiStore } from "../../stores/base/createUiStore";
import { cn } from "../../utils/cn";

function SidebarLink({ item, collapsed, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition duration-200",
          // Active links should feel clearly selected in a workflow-heavy UI.
          isActive
            ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
            : "text-slate-600 hover:bg-white hover:text-slate-900"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed ? <span>{item.label}</span> : null}
    </NavLink>
  );
}

function AppSidebar() {
  const currentUser = useCurrentUser();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const toggleSidebarCollapse = useUiStore((state) => state.toggleSidebarCollapse);

  const navigation = navigationByRole[currentUser?.role] || [];

  return (
    <>
      {/* Mobile overlay for dismissing the off-canvas sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-sm lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={closeSidebar}
      />
      <motion.aside
        initial={false}
        animate={{
          // Width animation supports the desktop collapse/expand interaction.
          width: sidebarCollapsed ? 96 : 288,
        }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={cn(
          "fixed inset-y-4 left-4 z-40 flex w-72 flex-col rounded-[22px] border border-white/80 bg-white/90 px-4 py-5 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        )}
      >
        <div className="mb-8 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!sidebarCollapsed ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-600">
                  Ranaka
                </p>
                <p className="text-sm font-semibold text-slate-900">Workflow Hub</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900 lg:block"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto">
          {/* Role-specific primary navigation */}
          <div className="space-y-2">
            {!sidebarCollapsed ? (
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Main
              </p>
            ) : null}
            {navigation.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={sidebarCollapsed}
                onNavigate={closeSidebar}
              />
            ))}
          </div>

          {/* Secondary shared links */}
          <div className="space-y-2">
            {!sidebarCollapsed ? (
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Updates
              </p>
            ) : null}
            {secondaryNavigation.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={sidebarCollapsed}
                onNavigate={closeSidebar}
              />
            ))}
          </div>
        </div>

        {/* Footer with signed-in user identity */}
        {!sidebarCollapsed ? (
          <div className="mt-6 rounded-2xl bg-slate-950 px-4 py-4 text-white">
            <p className="text-sm font-semibold">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
              {currentUser?.role?.replace("_", " ")}
            </p>
          </div>
        ) : null}
      </motion.aside>
    </>
  );
}

export default AppSidebar;
