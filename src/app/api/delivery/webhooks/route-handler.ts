import { NextResponse } from "next/server";
import { deliveryWebhookProcessor } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { notifyOrder } from "@/server/order-events";

function headerMap(request: Request): Record<string, string | undefined> {
  return Object.fromEntries(request.headers.entries());
}

export async function handleDeliveryWebhook(providerId: "wolt_drive" | "foodora", request: Request) {
  try {
    const rawBody = await request.text();
    const result = await deliveryWebhookProcessor.process(providerId, rawBody, headerMap(request));
    if (result.order) {
      await notifyOrder(result.order);
    }
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      ignored: result.ignored,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
