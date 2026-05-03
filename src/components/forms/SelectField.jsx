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
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {description ? (
          <span className="text-xs text-slate-500">{description}</span>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
              error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
              selectClassName
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      </label>
    );
  }
);

SelectField.displayName = "SelectField";

export default SelectField;
