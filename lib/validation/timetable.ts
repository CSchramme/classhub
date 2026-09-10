import { z } from "zod";

export const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
]);

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createTimetableEntrySchema = z
  .object({
    classId: z.string().min(1, "Klasse ist erforderlich."),
    subjectId: z.string().min(1, "Fach ist erforderlich."),
    dayOfWeek: dayOfWeekSchema,
    startTime: z.string().regex(timePattern, "Ungültige Uhrzeit."),
    endTime: z.string().regex(timePattern, "Ungültige Uhrzeit."),
    room: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((v) => (v ? v : undefined)),
    teacherName: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Ende muss nach dem Start liegen.",
    path: ["endTime"],
  });
