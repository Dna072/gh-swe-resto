import { NextResponse } from "next/server";
import { deliveryWebhookProcessor } from "@/server/composition";
import { errorResponse } from "@/server/http";

function headerMap(request: Request): Record<string, string | undefined> {
  return Object.fromEntries(request.headers.entries());
}

export async function handleDeliveryWebhook(providerId: "wolt_drive" | "foodora", request: Request) {
  try {
    const rawBody = await request.text();
    const result = await deliveryWebhookProcessor.process(providerId, rawBody, headerMap(request));
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      ignored: result.ignored,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
