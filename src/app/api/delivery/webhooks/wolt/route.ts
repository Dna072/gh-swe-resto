import { handleDeliveryWebhook } from "../route-handler";

export async function POST(request: Request) {
  return handleDeliveryWebhook("wolt_drive", request);
}
