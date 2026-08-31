import { handleDeliveryWebhook } from "../route-handler";

export async function POST(request: Request) {
  return handleDeliveryWebhook("foodora", request);
}
