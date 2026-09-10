import { z } from "zod";

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich.")
    .max(100, "Name ist zu lang.")
    .refine((v) => !v.includes("/"), "Der Name darf kein „/“ enthalten."),
  parentFolderId: z.string().min(1).nullable(),
});
