import type { PrintJob } from "@/domains/printing/models";
import type { PrintJobRepository } from "@/domains/printing/provider";
import type { MemoryState } from "./state";

export class InMemoryPrintJobRepository implements PrintJobRepository {
  constructor(private readonly state: MemoryState) {}

  async getByIdempotencyKey(key: string): Promise<PrintJob | null> {
    return this.state.printJobs.find((job) => job.idempotencyKey === key) ?? null;
  }

  async create(job: PrintJob): Promise<PrintJob> {
    this.state.printJobs.push(job);
    return job;
  }

  async listForOrder(orderId: string): Promise<PrintJob[]> {
    return this.state.printJobs.filter((job) => job.orderId === orderId);
  }
}