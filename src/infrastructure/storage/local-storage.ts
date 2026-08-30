import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BinaryObjectStorage, StoredObjectResult, StoredObjectWrite } from "./object-storage";

export function localUploadsRoot(): string {
  return process.env.LOCAL_UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads");
}

/**
 * Development adapter. Writes under public/uploads and serves them through
 * /api/media so files created after `next start` are still reachable.
 * Production uses Cloud Storage.
 */
export class LocalObjectStorage implements BinaryObjectStorage {
  constructor(private readonly root = localUploadsRoot()) {}

  publicUrl(objectPath: string): string {
    return `/api/media/${objectPath}`;
  }

  async put(object: StoredObjectWrite): Promise<StoredObjectResult> {
    const dest = path.join(this.root, object.path);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, object.bytes);
    return {
      path: object.path,
      url: this.publicUrl(object.path),
      contentType: object.contentType,
    };
  }

  async delete(objectPath: string): Promise<void> {
    try {
      await unlink(path.join(this.root, objectPath));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
