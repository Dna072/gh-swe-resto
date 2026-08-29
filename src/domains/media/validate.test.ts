import { describe, expect, it } from "vitest";
import { assertSafeImageUpload, detectImageKind, MAX_UPLOAD_BYTES } from "./validate";

function jpegBytes(length = 32): Buffer {
  const bytes = Buffer.alloc(length, 0);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

describe("image upload validation", () => {
  it("accepts JPEG magic bytes", () => {
    expect(detectImageKind(jpegBytes())).toBe("jpeg");
  });

  it("rejects executable-looking payloads", () => {
    expect(() => detectImageKind(Buffer.from("MZ executable"))).toThrow(/JPEG, PNG, or WebP/);
  });

  it("rejects oversized files", () => {
    expect(() => assertSafeImageUpload(jpegBytes(MAX_UPLOAD_BYTES + 1))).toThrow(/8 MB/);
  });

  it("rejects a declared MIME that is not an image", () => {
    expect(() => assertSafeImageUpload(jpegBytes(), "application/javascript")).toThrow(/not allowed/);
  });
});
