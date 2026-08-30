export interface StoredObjectWrite {
  path: string;
  bytes: Buffer;
  contentType: string;
}

export interface StoredObjectResult {
  path: string;
  url: string;
  contentType: string;
}

export interface BinaryObjectStorage {
  put(object: StoredObjectWrite): Promise<StoredObjectResult>;
  publicUrl(path: string): string;
  delete?(path: string): Promise<void>;
}
