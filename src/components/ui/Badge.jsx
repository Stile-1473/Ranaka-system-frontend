import { cn } from "../../utils/cn";

const badgeVariants = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
};

function Badge({ className, variant = "neutral", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold tracking-wide",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
