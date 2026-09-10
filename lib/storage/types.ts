/** A File/Folder is owned by exactly one user (private cloud) or one class
 * (class cloud) — see docs/database.md "File / Folder ownership". */
export type StorageOwner = { type: "user"; id: string } | { type: "class"; id: string };
