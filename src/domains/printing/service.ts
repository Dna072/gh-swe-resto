import { newId } from "@/lib/ids";
import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor } from "@/domains/auth/models";
import type { Order } from "@/domains/orders/models";
import { ticketFromOrder, type PrintJob } from "./models";
import type { PrintJobRepository, PrintProvider } from "./provider";

export class PrintingService {
  constructor(
    private readonly jobs: PrintJobRepository,
    private readonly provider: PrintProvider,
  ) {}

  async enqueue(actor: Actor, order: Order, restaurantName: string, idempotencyKey: string): Promise<PrintJob> {
    authorizationService.requirePermission(actor, "orders:print");
    const existing = await this.jobs.getByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }
    const job: PrintJob = {
      id: newId(),
      orderId: order.id,
      restaurantId: order.restaurantId,
      status: "QUEUED",
      idempotencyKey,
      payload: ticketFromOrder(order, restaurantName),
      createdAt: new Date().toISOString(),
    };
    await this.jobs.create(job);
    await this.provider.enqueue(job);
    return job;
  }
}
