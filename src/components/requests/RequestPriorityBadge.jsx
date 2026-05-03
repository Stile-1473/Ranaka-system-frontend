import Badge from "../ui/Badge";
import { formatPriority, mapPriorityToVariant } from "../../utils/requestHelpers";

function RequestPriorityBadge({ priority, className }) {
  return (
    <Badge className={className} variant={mapPriorityToVariant(priority)}>
      {formatPriority(priority)}
    </Badge>
  );
}

export default RequestPriorityBadge;
