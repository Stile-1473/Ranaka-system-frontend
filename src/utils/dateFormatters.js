export const formatDate = (value) => {
  if (!value) return "Not set";
  // en-ZW keeps formatting closer to the project's regional context.
  return new Intl.DateTimeFormat("en-ZW", {
    dateStyle: "medium",
  }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-ZW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};
