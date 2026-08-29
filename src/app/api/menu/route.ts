import { NextResponse } from "next/server";
import { loadPublicCatalog } from "@/server/catalog";
import { errorResponse } from "@/server/http";

export async function GET() {
  try {
    const catalog = await loadPublicCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    return errorResponse(error);
  }
}
