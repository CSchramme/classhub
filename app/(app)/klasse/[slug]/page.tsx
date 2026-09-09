import { redirect } from "next/navigation";

export default async function ClassIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/klasse/${slug}/uebersicht`);
}
