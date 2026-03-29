/** Backend origin for uploads and non-Vite assets */
export const API_ORIGIN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_ORIGIN) ||
  "http://localhost:5000";

/**
 * Turn `/uploads/...` or relative paths into absolute URLs the browser can load.
 */
export function assetUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `${API_ORIGIN}${s.startsWith("/") ? "" : "/"}${s}`;
}
