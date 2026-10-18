// Default to localhost for development. Use VITE_API_BASE_URL to override.
const FALLBACK_API_BASE_URL = "http://localhost:8080";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || FALLBACK_API_BASE_URL
).replace(/\/+$/, "");

export default BASE_URL;
