import { z } from "zod";

export const createExamSchema = z.object({
  classId: z.string().min(1, "Klasse ist erforderlich."),
  title: z.string().trim().min(1, "Titel ist erforderlich.").max(200),
  date: z.coerce.date({ error: "Datum ist erforderlich." }),
  topics: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  subjectId: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const examStatusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]);
