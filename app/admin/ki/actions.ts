"use server";

import { revalidatePath } from "next/cache";
import { requireSystemAdmin } from "@/lib/auth/authorization";
import { db } from "@/lib/db";

export async function setAiGloballyEnabledAction(enabled: boolean) {
  await requireSystemAdmin();
  await db.systemSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", aiGloballyEnabled: enabled },
    update: { aiGloballyEnabled: enabled },
  });
  revalidatePath("/admin/ki");
}
