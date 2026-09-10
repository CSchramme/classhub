import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(100),
});
