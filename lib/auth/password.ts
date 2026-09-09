import { hash, verify } from "@node-rs/argon2";

/**
 * Library defaults (argon2id, 19 MiB memory, 2 passes) already match the
 * OWASP baseline — no custom options needed.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}
