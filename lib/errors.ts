export type AppErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/**
 * Structured error for server actions/route handlers (spec §54). Thrown
 * deliberately by authorization/validation code; never carries a stack
 * trace or secret to the client — see `toActionError`.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
}

export type ActionError = { code: AppErrorCode; message: string };

/**
 * Converts any thrown value into a safe, client-facing error shape. Unknown
 * errors are logged server-side and collapsed to a generic INTERNAL_ERROR —
 * their real message/stack never reaches the client.
 */
export function toActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }
  console.error(error);
  return {
    code: "INTERNAL_ERROR",
    message: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  };
}

/** Route Handlers (unlike Server Actions) need a real HTTP status, not just
 * a code/message pair — used by app/api/cloud/* so far. */
export function statusForErrorCode(code: AppErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "RATE_LIMITED":
      return 429;
    case "INVALID_INPUT":
      return 400;
    case "INTERNAL_ERROR":
      return 500;
  }
}
