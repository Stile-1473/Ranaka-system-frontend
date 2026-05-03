import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const TextareaField = forwardRef(
  (
    { label, error, className, textareaClassName, description, rows = 5, ...props },
    ref
  ) => {
    return (
      <label className={cn("flex flex-col gap-2", className)}>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {description ? (
          <span className="text-xs text-slate-500">{description}</span>
        ) : null}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
            error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
            textareaClassName
          )}
          {...props}
        />
        {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      </label>
    );
  }
);

TextareaField.displayName = "TextareaField";

export default TextareaField;
