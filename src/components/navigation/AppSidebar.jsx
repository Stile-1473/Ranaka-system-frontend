import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { navigationByRole, secondaryNavigation } from "../../config/navigation";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUiStore } from "../../stores/base/createUiStore";
import { cn } from "../../utils/cn";

function SidebarLink({ item, iconOnly, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={iconOnly ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 text-sm font-medium transition duration-200",
          // Active links should feel clearly selected in a workflow-heavy UI.
          isActive
            ? iconOnly
              ? "h-12 w-12 justify-center rounded-[1.15rem] bg-emerald-500/16 text-emerald-300 shadow-[0_0_28px_rgba(34,197,94,0.28)] ring-1 ring-emerald-400/35"
              : "rounded-[1.1rem] bg-emerald-500/14 px-4 py-3 text-emerald-300 shadow-[0_0_28px_rgba(34,197,94,0.22)] ring-1 ring-emerald-400/25"
            : iconOnly
              ? "h-12 w-12 justify-center rounded-[1.15rem] text-slate-400 hover:bg-white/8 hover:text-slate-50"
              : "rounded-[1.1rem] px-4 py-3 text-slate-400 hover:bg-white/8 hover:text-slate-50"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!iconOnly ? <span>{item.label}</span> : null}
    </NavLink>
  );
}

function AppSidebar() {
  const currentUser = useCurrentUser();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const initials = `${currentUser?.firstName?.[0] || ""}${currentUser?.lastName?.[0] || ""}`.trim() || "U";

  const navigation = navigationByRole[currentUser?.role] || [];
  const showLabels = sidebarOpen;

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
          width: showLabels ? 288 : 88,
        }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={cn(
          "fixed inset-y-5 left-4 z-40 flex flex-col overflow-x-hidden rounded-[2rem] border border-white/10 bg-slate-950/46 px-3 py-5 shadow-[0_30px_100px_-46px_rgba(2,6,23,0.98)] backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "mb-8 flex items-center gap-3 px-1",
            showLabels ? "justify-between" : "justify-center"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              !showLabels && "justify-center"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/12 text-emerald-300 shadow-[0_0_28px_rgba(34,197,94,0.2)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {showLabels ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                  Ranaka
                </p>
                <p className="text-sm font-semibold text-slate-50">Workspace</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto">
          {/* Role-specific primary navigation */}
          <div className={cn("space-y-2", !showLabels && "flex flex-col items-center")}>
            {showLabels ? (
              <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Main
              </p>
            ) : null}
            {navigation.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                iconOnly={!showLabels}
                onNavigate={closeSidebar}
              />
            ))}
          </div>

          {/* Secondary shared links */}
          <div className={cn("space-y-2", !showLabels && "flex flex-col items-center")}>
            {showLabels ? (
              <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Updates
              </p>
            ) : null}
            {secondaryNavigation.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                iconOnly={!showLabels}
                onNavigate={closeSidebar}
              />
            ))}
          </div>
        </div>

        {/* Footer with signed-in user identity */}
        <div className={cn("mt-6 flex", showLabels ? "justify-start px-1" : "justify-center")}>
          <div
            title={`${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "User"}
            className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-white/10 bg-white/6 text-sm font-semibold text-slate-100 shadow-[0_18px_40px_-26px_rgba(2,6,23,0.9)]"
          >
            {initials}
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default AppSidebar;
