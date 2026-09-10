import "server-only";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getStorageClient } from "@/lib/storage/client";
import {
  USER_STORAGE_QUOTA_BYTES,
  CLASS_STORAGE_QUOTA_BYTES,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/storage/constants";
import type { StorageOwner } from "@/lib/storage/types";

function ownerWhere(owner: StorageOwner) {
  return owner.type === "user"
    ? { ownerUserId: owner.id, ownerClassId: null }
    : { ownerClassId: owner.id, ownerUserId: null };
}

function ownerData(owner: StorageOwner) {
  return {
    ownerUserId: owner.type === "user" ? owner.id : null,
    ownerClassId: owner.type === "class" ? owner.id : null,
  };
}

function quotaFor(owner: StorageOwner): bigint {
  return owner.type === "user" ? USER_STORAGE_QUOTA_BYTES : CLASS_STORAGE_QUOTA_BYTES;
}

/** Random, not derived from the filename — avoids path traversal / special
 * characters in S3 keys entirely. The original filename is kept only in
 * the DB row (File.originalFilename) and served back via Content-Disposition. */
function buildStorageKey(owner: StorageOwner, originalFilename: string): string {
  const dot = originalFilename.lastIndexOf(".");
  const rawExt = dot > 0 ? originalFilename.slice(dot) : "";
  const safeExt = rawExt.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 10);
  const prefix = owner.type === "user" ? `private/${owner.id}` : `class/${owner.id}`;
  return `${prefix}/${crypto.randomUUID()}${safeExt}`;
}

/** RFC 5987 fallback pair so filenames with quotes, umlauts, etc. can't
 * break the header and still render correctly in modern browsers. */
function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function getStorageUsage(owner: StorageOwner): Promise<{
  usedBytes: bigint;
  quotaBytes: bigint;
}> {
  if (owner.type === "user") {
    const user = await db.user.findUniqueOrThrow({
      where: { id: owner.id },
      select: { storageUsedBytes: true },
    });
    return { usedBytes: user.storageUsedBytes, quotaBytes: USER_STORAGE_QUOTA_BYTES };
  }
  const klass = await db.class.findUniqueOrThrow({
    where: { id: owner.id },
    select: { storageUsedBytes: true },
  });
  return { usedBytes: klass.storageUsedBytes, quotaBytes: CLASS_STORAGE_QUOTA_BYTES };
}

export async function listFolderContents(owner: StorageOwner, folderId: string | null) {
  if (folderId) {
    const folder = await db.folder.findFirst({
      where: { id: folderId, ...ownerWhere(owner) },
      select: { id: true },
    });
    if (!folder) throw new AppError("NOT_FOUND", "Ordner nicht gefunden.");
  }

  // Sequential, not Promise.all: concurrent queries intermittently drop the
  // connection against the local dev database — see lib/features/dashboard.ts
  // for the first occurrence of this and why it's not worth fighting for a
  // page load that isn't latency-sensitive.
  const folders = await db.folder.findMany({
    where: { parentFolderId: folderId, ...ownerWhere(owner) },
    orderBy: { name: "asc" },
  });
  const files = await db.file.findMany({
    where: { folderId, ...ownerWhere(owner) },
    orderBy: { originalFilename: "asc" },
    include: { uploadedBy: { select: { displayName: true } } },
  });

  return { folders, files };
}

/** Breadcrumb chain from root to `folderId`. Sequential by design — folder
 * nesting in a school context is shallow, and this keeps each step a
 * simple, ownership-checked lookup rather than a recursive SQL query. */
export async function getFolderPath(
  owner: StorageOwner,
  folderId: string | null,
): Promise<{ id: string; name: string }[]> {
  const path: { id: string; name: string }[] = [];
  let currentId = folderId;
  while (currentId) {
    const folder: { id: string; name: string; parentFolderId: string | null } | null =
      await db.folder.findFirst({
        where: { id: currentId, ...ownerWhere(owner) },
        select: { id: true, name: true, parentFolderId: true },
      });
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentFolderId;
  }
  return path;
}

export async function createFolder(
  owner: StorageOwner,
  name: string,
  parentFolderId: string | null,
) {
  if (parentFolderId) {
    const parent = await db.folder.findFirst({
      where: { id: parentFolderId, ...ownerWhere(owner) },
      select: { id: true },
    });
    if (!parent) {
      throw new AppError("NOT_FOUND", "Übergeordneter Ordner nicht gefunden.");
    }
  }

  return db.folder.create({
    data: { name, parentFolderId, ...ownerData(owner) },
  });
}

export async function deleteFolder(owner: StorageOwner, folderId: string) {
  const folder = await db.folder.findFirst({
    where: { id: folderId, ...ownerWhere(owner) },
    select: { id: true },
  });
  if (!folder) throw new AppError("NOT_FOUND", "Ordner nicht gefunden.");

  const childFolderCount = await db.folder.count({ where: { parentFolderId: folderId } });
  const fileCount = await db.file.count({ where: { folderId } });
  if (childFolderCount > 0 || fileCount > 0) {
    throw new AppError(
      "INVALID_INPUT",
      "Der Ordner ist nicht leer. Lösche zuerst seinen Inhalt.",
    );
  }

  await db.folder.delete({ where: { id: folderId } });
}

export async function uploadFile(params: {
  owner: StorageOwner;
  uploadedByUserId: string;
  folderId: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  body: Buffer;
}) {
  const {
    owner,
    uploadedByUserId,
    folderId,
    originalFilename,
    mimeType,
    sizeBytes,
    body,
  } = params;

  if (sizeBytes <= 0) {
    throw new AppError("INVALID_INPUT", "Die Datei ist leer.");
  }
  if (sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    throw new AppError(
      "INVALID_INPUT",
      `Die Datei ist zu groß (max. ${Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))} MB).`,
    );
  }
  if (folderId) {
    const folder = await db.folder.findFirst({
      where: { id: folderId, ...ownerWhere(owner) },
      select: { id: true },
    });
    if (!folder) throw new AppError("NOT_FOUND", "Ordner nicht gefunden.");
  }

  const storageKey = buildStorageKey(owner, originalFilename);
  const client = getStorageClient();

  // Uploaded to S3 before the quota is checked/reserved: we need the byte
  // count we're actually holding, and re-buffering here to check first
  // would double the memory cost for no benefit at this file-size cap. If
  // the DB step below fails (quota exceeded or otherwise), the object is
  // deleted again — see catch block.
  await client.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: storageKey,
      Body: body,
      ContentType: mimeType,
    }),
  );

  try {
    const sizeBigInt = BigInt(sizeBytes);
    const quota = quotaFor(owner);

    return await db.$transaction(async (tx) => {
      // Single atomic conditional UPDATE — see docs/database.md "Storage
      // quotas". Quota is a compile-time constant, so the WHERE clause can
      // express "current + size <= quota" directly; Postgres re-evaluates
      // it per-row, which is what actually closes the parallel-upload race.
      const claim =
        owner.type === "user"
          ? await tx.user.updateMany({
              where: { id: owner.id, storageUsedBytes: { lte: quota - sizeBigInt } },
              data: { storageUsedBytes: { increment: sizeBigInt } },
            })
          : await tx.class.updateMany({
              where: { id: owner.id, storageUsedBytes: { lte: quota - sizeBigInt } },
              data: { storageUsedBytes: { increment: sizeBigInt } },
            });

      if (claim.count === 0) {
        throw new AppError(
          "INVALID_INPUT",
          "Das Speicherkontingent reicht für diese Datei nicht aus.",
        );
      }

      return tx.file.create({
        data: {
          originalFilename,
          mimeType,
          sizeBytes: sizeBigInt,
          storageKey,
          folderId,
          uploadedByUserId,
          ...ownerData(owner),
        },
      });
    });
  } catch (error) {
    await client
      .send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: storageKey }))
      .catch((cleanupError) => {
        console.error("Failed to clean up orphaned upload", storageKey, cleanupError);
      });
    throw error;
  }
}

export async function deleteFile(owner: StorageOwner, fileId: string) {
  const file = await db.file.findFirst({ where: { id: fileId, ...ownerWhere(owner) } });
  if (!file) throw new AppError("NOT_FOUND", "Datei nicht gefunden.");

  await db.$transaction(async (tx) => {
    await tx.file.delete({ where: { id: fileId } });
    if (owner.type === "user") {
      await tx.user.updateMany({
        where: { id: owner.id, storageUsedBytes: { gte: file.sizeBytes } },
        data: { storageUsedBytes: { decrement: file.sizeBytes } },
      });
    } else {
      await tx.class.updateMany({
        where: { id: owner.id, storageUsedBytes: { gte: file.sizeBytes } },
        data: { storageUsedBytes: { decrement: file.sizeBytes } },
      });
    }
  });

  // DB is the source of truth and has already committed; a failure to
  // delete the S3 object here just leaks storage space, not correctness.
  const client = getStorageClient();
  await client
    .send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: file.storageKey }))
    .catch((error) => {
      console.error("Failed to delete storage object", file.storageKey, error);
    });
}

export async function getDownloadUrl(
  owner: StorageOwner,
  fileId: string,
): Promise<string> {
  const file = await db.file.findFirst({ where: { id: fileId, ...ownerWhere(owner) } });
  if (!file) throw new AppError("NOT_FOUND", "Datei nicht gefunden.");

  const client = getStorageClient();
  const command = new GetObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: file.storageKey,
    ResponseContentDisposition: contentDisposition(file.originalFilename),
  });
  return getSignedUrl(client, command, { expiresIn: 60 });
}
