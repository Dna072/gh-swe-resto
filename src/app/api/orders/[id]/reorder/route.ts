import { NextResponse } from "next/server";
import { orderService } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = new URL(request.url).searchParams.get("token") ?? undefined;
    const lines = await orderService.reorderLines(id, token);
    return NextResponse.json({ lines });
  } catch (error) {
    return errorResponse(error);
  }
}
