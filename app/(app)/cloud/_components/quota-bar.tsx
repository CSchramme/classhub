import { cn, formatBytes } from "@/lib/utils";

export function QuotaBar({
  usedBytes,
  quotaBytes,
}: {
  usedBytes: bigint;
  quotaBytes: bigint;
}) {
  const pct =
    quotaBytes > BigInt(0)
      ? Math.min(100, Number((usedBytes * BigInt(100)) / quotaBytes))
      : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Speicher</span>
        <span>
          {formatBytes(usedBytes)} / {formatBytes(quotaBytes)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            pct >= 90 ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
