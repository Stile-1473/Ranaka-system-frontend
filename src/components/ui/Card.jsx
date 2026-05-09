import { cn } from "../../utils/cn";

function Card({ className, children }) {
  return <div className={cn("glass-panel min-w-0 p-5 lg:p-6", className)}>{children}</div>;
}

export default Card;
