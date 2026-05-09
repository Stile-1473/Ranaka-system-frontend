import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { navigationByRole, secondaryNavigation } from "../../config/navigation";
import { useCurrentUser } from "../../hooks/useCurrentUser";

function AppCommandSearch() {
  const currentUser = useCurrentUser();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const items = useMemo(() => {
    const roleItems = navigationByRole[currentUser?.role] || [];
    return [...roleItems, ...secondaryNavigation, { label: "Profile", to: "/profile" }];
  }, [currentUser?.role]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items.slice(0, 5);

    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.to.toLowerCase().includes(normalized)
      )
      .slice(0, 6);
  }, [items, query]);

  return (
    <div className="relative hidden w-full max-w-xs xl:block">
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        placeholder="Search workspace..."
        className="glass-control h-10 w-full rounded-full py-2 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
      />

      {focused ? (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-[1.15rem] border border-white/10 bg-slate-950/78 p-2 shadow-[0_24px_80px_-38px_rgba(2,6,23,0.92)] backdrop-blur-2xl">
          {results.length > 0 ? (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/8 hover:text-slate-50"
                >
                  {Icon ? <Icon className="h-4 w-4 text-emerald-300" /> : null}
                  <span className="font-semibold">{item.label}</span>
                  <span className="ml-auto text-xs text-slate-500">{item.to}</span>
                </Link>
              );
            })
          ) : (
            <div className="px-3 py-4 text-sm text-slate-400">
              No workspace results found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default AppCommandSearch;
