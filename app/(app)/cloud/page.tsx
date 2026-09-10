import { redirect } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth/authorization";

export default async function CloudPage() {
  await requireUserOrRedirect();
  redirect("/cloud/privat");
}
