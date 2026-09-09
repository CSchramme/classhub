import { notFound } from "next/navigation";
import Link from "next/link";
import { requireClassMemberOrRedirect } from "@/lib/auth/authorization";
import { getClassBySlug } from "@/lib/classes";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Übersicht", segment: "uebersicht" },
  { label: "Mitglieder", segment: "mitglieder" },
];

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const klass = await getClassBySlug(slug);
  if (!klass) notFound();

  await requireClassMemberOrRedirect(klass.id);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{klass.name}</h1>
        <p className="text-muted-foreground">
          {klass.school.name} · {klass.schoolYear.name}
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.segment}
            href={`/klasse/${slug}/${tab.segment}`}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
