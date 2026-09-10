import { z } from "zod";
import { prioritySchema } from "@/lib/validation/todo";

export const createHomeworkSchema = z.object({
  title: z.string().trim().min(1, "Titel ist erforderlich.").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  dueDate: z.coerce.date({ error: "Fälligkeitsdatum ist erforderlich." }),
  priority: prioritySchema.default("MEDIUM"),
  subjectId: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  classId: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const homeworkStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]);
