import { z } from "zod";

export const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Titel ist erforderlich.").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  priority: prioritySchema.default("MEDIUM"),
  category: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v ? v : undefined)),
  subjectId: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const todoStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]);
