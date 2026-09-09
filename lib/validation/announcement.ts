import { z } from "zod";

export const createAnnouncementSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(1, "Titel ist erforderlich.").max(200),
  content: z.string().trim().min(1, "Inhalt ist erforderlich.").max(5000),
  expiresAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});
