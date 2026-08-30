import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { localUploadsRoot } from "@/infrastructure/storage/local-storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const segments = (await context.params).path ?? [];
  if (segments.length === 0 || segments.some((segment) => segment === ".." || segment.includes("\\"))) {
    return NextResponse.json({ code: "VALIDATION", message: "Invalid media path." }, { status: 400 });
  }

  const root = path.resolve(localUploadsRoot());
  const filePath = path.resolve(root, ...segments);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Invalid media path." }, { status: 403 });
  }

  try {
    const bytes = await readFile(filePath);
    const extension = path.extname(filePath).slice(1).toLowerCase();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ code: "NOT_FOUND", message: "Photograph not found." }, { status: 404 });
    }
    throw error;
  }
}
