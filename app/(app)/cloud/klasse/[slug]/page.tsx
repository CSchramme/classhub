import { notFound } from "next/navigation";
import { requireClassMemberOrRedirect } from "@/lib/auth/authorization";
import { getClassBySlug } from "@/lib/classes";
import { getStorageUsage } from "@/lib/storage";
import { CloudBrowser } from "../../_components/cloud-browser";

export default async function ClassCloudPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { slug } = await params;
  const klass = await getClassBySlug(slug);
  if (!klass) notFound();

  await requireClassMemberOrRedirect(klass.id);
  const { folder } = await searchParams;
  const owner = { type: "class" as const, id: klass.id };
  const { usedBytes, quotaBytes } = await getStorageUsage(owner);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cloud – {klass.name}</h1>
        <p className="text-muted-foreground">
          Sichtbar für alle Mitglieder dieser Klasse.
        </p>
      </div>
      <CloudBrowser
        owner={owner}
        basePath={`/cloud/klasse/${slug}`}
        classId={klass.id}
        currentFolderId={folder ?? null}
        usedBytes={usedBytes}
        quotaBytes={quotaBytes}
      />
    </div>
  );
}
