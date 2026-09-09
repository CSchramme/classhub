import { Button } from "@/components/ui/button";

export function ArchiveToggleForm({
  action,
  archived,
}: {
  action: () => Promise<void>;
  archived: boolean;
}) {
  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm">
        {archived ? "Reaktivieren" : "Archivieren"}
      </Button>
    </form>
  );
}
