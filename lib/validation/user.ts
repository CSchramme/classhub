import { z } from "zod";

// V1 only exposes STUDENT/SYSTEM_ADMIN in the UI — TEACHER/SCHOOL_ADMIN/PARENT/
// CLASS_ADMIN are reserved in the schema (spec §10) but not usable yet.
export const assignableRoleSchema = z.enum(["STUDENT", "SYSTEM_ADMIN"]);

/** Self-service profile edit — deliberately excludes email/role/school,
 * which carry authorization or identity implications and aren't editable
 * here (spec has no email-change/re-verification flow). */
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname ist erforderlich.").max(100),
  lastName: z.string().trim().min(1, "Nachname ist erforderlich.").max(100),
  displayName: z.string().trim().min(1, "Anzeigename ist erforderlich.").max(100),
});

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname ist erforderlich.").max(100),
  lastName: z.string().trim().min(1, "Nachname ist erforderlich.").max(100),
  displayName: z.string().trim().min(1, "Anzeigename ist erforderlich.").max(100),
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse."),
  role: assignableRoleSchema,
  schoolId: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  classId: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  aiAccess: z.coerce.boolean().optional().default(false),
});
