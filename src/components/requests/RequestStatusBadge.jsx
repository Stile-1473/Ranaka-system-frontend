import Badge from "../ui/Badge";
import {
  formatRequestStatus,
  mapRequestStatusToVariant,
} from "../../utils/requestHelpers";

function RequestStatusBadge({ status, isOverdue = false, className }) {
  return (
    <Badge
      className={className}
      variant={mapRequestStatusToVariant(status, isOverdue)}
    >
      {formatRequestStatus(status, isOverdue)}
    </Badge>
  );
}

export default RequestStatusBadge;
