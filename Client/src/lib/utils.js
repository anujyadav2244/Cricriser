import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function humanizeText(value) {
  if (value === null || value === undefined) return "";

  const normalized = String(value)
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return "";

  const preserveUpper = new Set(["LBW", "ODI", "T20", "T10", "DLS", "ICC", "IPL"]);

  return normalized
    .split(" ")
    .map((word) => {
      const upper = word.toUpperCase();

      if (preserveUpper.has(upper)) return upper;
      if (/^\d/.test(word)) return upper;

      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join(" ");
}
