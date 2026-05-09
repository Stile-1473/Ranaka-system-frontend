import { cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "../../utils/cn";

const buttonVariants = {
  primary:
    "border border-emerald-400/20 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_16px_40px_-24px_rgba(34,197,94,0.8)] hover:from-emerald-400 hover:to-emerald-500",
  secondary:
    "border border-white/10 bg-white/6 text-slate-200 shadow-[0_16px_40px_-24px_rgba(2,6,23,0.9)] backdrop-blur-xl hover:bg-white/10 hover:text-white",
  ghost: "text-slate-300 hover:bg-white/8 hover:text-white",
};

const Button = forwardRef(
  (
    {
      asChild = false,
      children,
      className,
      variant = "primary",
      type = "button",
      ...props
    },
    ref
  ) => {
    const buttonClassName = cn(
      "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
      buttonVariants[variant],
      className
    );

    // asChild lets us style links like buttons without duplicating class names
    // throughout feature pages and table actions.
    if (asChild && isValidElement(children)) {
      return cloneElement(children, {
        ...props,
        ref,
        className: cn(buttonClassName, children.props.className),
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
