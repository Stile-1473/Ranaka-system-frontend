import { cn } from "../../utils/cn";

const badgeVariants = {
  neutral: "border-white/10 bg-white/6 text-slate-300",
  success: "border-emerald-400/20 bg-emerald-500/12 text-emerald-300",
  warning: "border-amber-400/20 bg-amber-500/12 text-amber-300",
  danger: "border-rose-400/20 bg-rose-500/12 text-rose-300",
};

function Badge({ className, variant = "neutral", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-xl",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
