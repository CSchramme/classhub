import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { getStorageUsage } from "@/lib/storage";
import { CloudBrowser } from "../_components/cloud-browser";

export default async function PrivateCloudPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const user = await requireUserOrRedirect();
  const { folder } = await searchParams;
  const owner = { type: "user" as const, id: user.id };
  const { usedBytes, quotaBytes } = await getStorageUsage(owner);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Privater Cloud-Speicher</h1>
        <p className="text-muted-foreground">Nur für dich sichtbar.</p>
      </div>
      <CloudBrowser
        owner={owner}
        basePath="/cloud/privat"
        classId={null}
        currentFolderId={folder ?? null}
        usedBytes={usedBytes}
        quotaBytes={quotaBytes}
      />
    </div>
  );
}
