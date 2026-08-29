import { AppError } from "@/lib/errors";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MIN_MEAL_EDGE = 400;

export type AllowedImageKind = "jpeg" | "png" | "webp";

export function detectImageKind(bytes: Buffer): AllowedImageKind {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  throw new AppError("VALIDATION", "Upload a JPEG, PNG, or WebP photograph.");
}

export function assertSafeImageUpload(bytes: Buffer, declaredType?: string): AllowedImageKind {
  if (bytes.length === 0) {
    throw new AppError("VALIDATION", "The image file is empty.");
  }
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new AppError("VALIDATION", "Photographs must be 8 MB or smaller.");
  }
  const kind = detectImageKind(bytes);
  if (declaredType) {
    const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
    if (!allowed.has(declaredType) && declaredType !== "application/octet-stream") {
      throw new AppError("VALIDATION", "That file type is not allowed.");
    }
  }
  return kind;
}

export function extensionFor(kind: AllowedImageKind): "jpg" | "png" | "webp" {
  if (kind === "jpeg") {
    return "jpg";
  }
  return kind;
}
