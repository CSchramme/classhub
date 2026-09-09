/** Shared shape for useActionState-driven form actions across the app. */
export type FormActionState = {
  error: string | null;
};

export const initialFormActionState: FormActionState = { error: null };

/** Same shape, plus an optional one-time value to show the caller (e.g. a
 * freshly issued setup link) — used by admin/benutzer's create/reset actions. */
export type CreateUserActionState = {
  error: string | null;
  setupUrl?: string;
};

export const initialCreateUserActionState: CreateUserActionState = { error: null };
