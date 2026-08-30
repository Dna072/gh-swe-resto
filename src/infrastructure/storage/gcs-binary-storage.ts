import { Storage } from "@google-cloud/storage";
import type { BinaryObjectStorage, StoredObjectResult, StoredObjectWrite } from "./object-storage";

export class GcsBinaryStorage implements BinaryObjectStorage {
  constructor(
    private readonly bucketName: string,
    private readonly storage = new Storage(),
  ) {}

  publicUrl(objectPath: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${objectPath}`;
  }

  async put(object: StoredObjectWrite): Promise<StoredObjectResult> {
    const file = this.storage.bucket(this.bucketName).file(object.path);
    await file.save(object.bytes, {
      contentType: object.contentType,
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    return {
      path: object.path,
      url: this.publicUrl(object.path),
      contentType: object.contentType,
    };
  }

  async delete(objectPath: string): Promise<void> {
    await this.storage.bucket(this.bucketName).file(objectPath).delete({ ignoreNotFound: true });
  }
}
