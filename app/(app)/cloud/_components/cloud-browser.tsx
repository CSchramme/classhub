import Link from "next/link";
import { listFolderContents, getFolderPath } from "@/lib/storage";
import type { StorageOwner } from "@/lib/storage/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuotaBar } from "./quota-bar";
import { CreateFolderForm } from "./create-folder-form";
import { UploadForm } from "./upload-form";
import { FolderRow } from "./folder-row";
import { FileRow } from "./file-row";

export async function CloudBrowser({
  owner,
  basePath,
  classId,
  currentFolderId,
  usedBytes,
  quotaBytes,
}: {
  owner: StorageOwner;
  basePath: string;
  classId: string | null;
  currentFolderId: string | null;
  usedBytes: bigint;
  quotaBytes: bigint;
}) {
  // Sequential — see the comment in lib/storage/index.ts on why this
  // dev database doesn't tolerate concurrent queries well.
  const { folders, files } = await listFolderContents(owner, currentFolderId);
  const path = await getFolderPath(owner, currentFolderId);

  const returnPath = currentFolderId ? `${basePath}?folder=${currentFolderId}` : basePath;

  return (
    <div className="flex flex-col gap-6">
      <QuotaBar usedBytes={usedBytes} quotaBytes={quotaBytes} />

      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={basePath} className="hover:text-foreground hover:underline">
          Cloud
        </Link>
        {path.map((segment) => (
          <span key={segment.id} className="flex items-center gap-1.5">
            <span>/</span>
            <Link
              href={`${basePath}?folder=${segment.id}`}
              className="hover:text-foreground hover:underline"
            >
              {segment.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Neuer Ordner</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateFolderForm
              classId={classId}
              parentFolderId={currentFolderId}
              returnPath={returnPath}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datei hochladen</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadForm classId={classId} folderId={currentFolderId} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inhalt</CardTitle>
        </CardHeader>
        <CardContent>
          {folders.length === 0 && files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Dieser Ordner ist leer.</p>
          ) : (
            <ul>
              {folders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  basePath={basePath}
                  classId={classId}
                  returnPath={returnPath}
                />
              ))}
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  classId={classId}
                  returnPath={returnPath}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
