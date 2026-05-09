import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

const SelectField = forwardRef(
  (
    {
      label,
      error,
      className,
      selectClassName,
      description,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <label className={cn("flex flex-col gap-2", className)}>
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {description ? (
          <span className="text-xs text-slate-300">{description}</span>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-[1.05rem] border border-white/10 bg-white/6 px-4 py-3 pr-11 text-sm text-slate-50 shadow-[0_16px_40px_-30px_rgba(2,6,23,1)] outline-none backdrop-blur-xl transition focus:border-emerald-400/35 focus:bg-white/8 focus:ring-4 focus:ring-emerald-500/10",
              error && "border-rose-400/35 focus:border-rose-400/45 focus:ring-rose-500/10",
              selectClassName
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        {error ? <span className="text-xs text-rose-300">{error}</span> : null}
      </label>
    );
  }
);

SelectField.displayName = "SelectField";

export default SelectField;
