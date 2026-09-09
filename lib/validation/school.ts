import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(200),
});

export const createSchoolYearSchema = z
  .object({
    schoolId: z.string().min(1, "Schule ist erforderlich."),
    name: z.string().trim().min(1, "Bezeichnung ist erforderlich.").max(50),
    startDate: z.coerce.date({ error: "Startdatum ist erforderlich." }),
    endDate: z.coerce.date({ error: "Enddatum ist erforderlich." }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Enddatum muss nach dem Startdatum liegen.",
    path: ["endDate"],
  });

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createClassSchema = z.object({
  schoolId: z.string().min(1, "Schule ist erforderlich."),
  schoolYearId: z.string().min(1, "Schuljahr ist erforderlich."),
  name: z.string().trim().min(1, "Name ist erforderlich.").max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug ist erforderlich.")
    .max(50)
    .regex(
      slugPattern,
      "Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.",
    ),
});
