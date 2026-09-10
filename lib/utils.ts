export { cn } from "cn";

/** e.g. 1536n -> "1,5 KB". Used for storage quota display. */
export function formatBytes(bytes: bigint | number): string {
  const value = typeof bytes === "bigint" ? Number(bytes) : bytes;
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  if (value === 0) return "0 Bytes";
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const scaled = value / 1024 ** exponent;
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(scaled)} ${units[exponent]}`;
}
