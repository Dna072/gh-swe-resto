export interface StoredObject {
  bucket: string;
  path: string;
  contentType: string;
}

export interface ObjectStorage {
  publicUrl(object: StoredObject): string;
}

export class CloudStorageAdapter implements ObjectStorage {
  publicUrl(object: StoredObject): string {
    return `https://storage.googleapis.com/${object.bucket}/${object.path}`;
  }
}
