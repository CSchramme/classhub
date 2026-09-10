import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

let cachedClient: S3Client | null = null;

/** Lazily constructed: storage env vars are optional at boot (lib/env.ts)
 * so `npm run dev` isn't blocked before this subsystem is configured —
 * this is where the "actually required for storage" check happens. */
export function getStorageClient(): S3Client {
  if (cachedClient) return cachedClient;

  if (!env.STORAGE_ENDPOINT || !env.STORAGE_ACCESS_KEY || !env.STORAGE_SECRET_KEY) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Cloud-Speicher ist auf diesem Server nicht konfiguriert.",
    );
  }

  cachedClient = new S3Client({
    endpoint: env.STORAGE_ENDPOINT,
    region: env.STORAGE_REGION,
    forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY,
      secretAccessKey: env.STORAGE_SECRET_KEY,
    },
  });
  return cachedClient;
}
