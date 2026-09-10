"use server";

import { revalidatePath } from "next/cache";
import {
  requireUser,
  requireClassMember,
  requireSystemAdmin,
} from "@/lib/auth/authorization";
import { createEvent, deleteEvent } from "@/lib/features/events";
import { createEventSchema } from "@/lib/validation/event";
import { toActionError, AppError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createEventAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();

  const parsed = createEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location") || undefined,
    category: formData.get("category") || undefined,
    visibility: formData.get("visibility") || "PERSONAL",
    classId: formData.get("classId") || undefined,
    schoolId: formData.get("schoolId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    if (parsed.data.visibility === "CLASS" && parsed.data.classId) {
      await requireClassMember(parsed.data.classId);
    }
    if (parsed.data.visibility === "SCHOOL") {
      await requireSystemAdmin();
    }

    await createEvent(user.id, parsed.data);
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    return { error: toActionError(error).message };
  }

  revalidatePath("/home/termine");
  return { error: null };
}

export async function deleteEventAction(eventId: string) {
  const user = await requireUser();
  await deleteEvent(eventId, user.id);
  revalidatePath("/home/termine");
}
