/** Max units available for a listing (DB `stock` or static catalog without field → 1). */
export function getListingStockCap(productOrLine) {
  const s = productOrLine?.stock;
  if (s === undefined || s === null || s === "") return 1;
  const n = Number(s);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.floor(n));
}
