import "server-only";
import { db } from "@/lib/db";
import type { z } from "zod";
import type { updateProfileSchema } from "@/lib/validation/user";

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  return db.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName,
    },
  });
}
