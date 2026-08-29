import { NextResponse } from "next/server";
import { loadPublicItem } from "@/server/catalog";
import { errorResponse } from "@/server/http";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const item = await loadPublicItem(slug);
    return NextResponse.json(item);
  } catch (error) {
    return errorResponse(error);
  }
}
