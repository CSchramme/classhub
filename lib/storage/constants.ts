/** Spec §32/33: 5 GB private cloud per user, 5 GB class cloud per class. */
export const USER_STORAGE_QUOTA_BYTES = BigInt(5) * BigInt(1024 ** 3);
export const CLASS_STORAGE_QUOTA_BYTES = BigInt(5) * BigInt(1024 ** 3);

/** Per-file cap, independent of the quota — keeps a single upload from
 * blocking the Node process for too long (spec §33 server-proxied upload). */
export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
