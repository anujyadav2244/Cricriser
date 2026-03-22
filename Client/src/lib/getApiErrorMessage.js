export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;

  if (error?.message === "Network Error" || error?.code === "ERR_NETWORK") {
    return "Cannot reach server. Check API URL, backend status, and CORS settings.";
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message && typeof data.message === "string") {
    return data.message;
  }

  if (data?.error && typeof data.error === "string") {
    return data.error;
  }

  if (error?.message && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}
