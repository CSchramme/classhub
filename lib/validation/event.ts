import { z } from "zod";

export const eventVisibilitySchema = z.enum(["PERSONAL", "CLASS", "SCHOOL"]);

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, "Titel ist erforderlich.").max(200),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v ? v : undefined)),
    startsAt: z.coerce.date({ error: "Start ist erforderlich." }),
    endsAt: z.coerce.date({ error: "Ende ist erforderlich." }),
    location: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : undefined)),
    category: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((v) => (v ? v : undefined)),
    visibility: eventVisibilitySchema.default("PERSONAL"),
    classId: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined)),
    schoolId: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "Ende muss nach dem Start liegen.",
    path: ["endsAt"],
  })
  .refine((data) => data.visibility !== "CLASS" || !!data.classId, {
    message: "Bitte eine Klasse wählen.",
    path: ["classId"],
  })
  .refine((data) => data.visibility !== "SCHOOL" || !!data.schoolId, {
    message: "Bitte eine Schule wählen.",
    path: ["schoolId"],
  });
