export const extractApiErrorMessage = (error) => {
  // Prefer the backend's top-level business message when available.
  const detailMessage = error?.response?.data?.message;
  if (detailMessage) return detailMessage;

  // If there is no top-level message, try the first field validation message.
  const fieldErrors = error?.response?.data?.details;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstFieldError = Object.values(fieldErrors)[0];
    if (firstFieldError) return String(firstFieldError);
  }

  // Last-resort client-side fallback.
  return error?.message || "Something went wrong. Please try again.";
};

export const extractFieldErrors = (error) => {
  // Lets forms map backend validation details to field-level messages.
  const details = error?.response?.data?.details;
  return details && typeof details === "object" ? details : {};
};
