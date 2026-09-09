/** Shared shape for useActionState-driven form actions across the app. */
export type FormActionState = {
  error: string | null;
};

export const initialFormActionState: FormActionState = { error: null };
