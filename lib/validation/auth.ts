import { z } from "zod";

// NIST 800-63B favors length over forced complexity rules; max length caps
// argon2 hashing cost against pathologically large inputs.
const passwordSchema = z
  .string()
  .min(10, "Das Passwort muss mindestens 10 Zeichen lang sein.")
  .max(128, "Das Passwort ist zu lang.");

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse."),
  password: passwordSchema,
  firstName: z.string().trim().min(1, "Vorname ist erforderlich.").max(100),
  lastName: z.string().trim().min(1, "Nachname ist erforderlich.").max(100),
  displayName: z.string().trim().min(1, "Anzeigename ist erforderlich.").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse."),
  password: z.string().min(1, "Passwort ist erforderlich.").max(128),
});

export const setupPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich.").max(128),
  newPassword: passwordSchema,
});
