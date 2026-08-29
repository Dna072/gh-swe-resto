import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BinaryObjectStorage, StoredObjectResult, StoredObjectWrite } from "./object-storage";

/**
 * Development adapter. Writes under public/uploads so Next can serve files.
 * Production uses Cloud Storage.
 */
export class LocalObjectStorage implements BinaryObjectStorage {
  constructor(private readonly root = path.join(process.cwd(), "public", "uploads")) {}

  publicUrl(objectPath: string): string {
    return `/uploads/${objectPath}`;
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
}
