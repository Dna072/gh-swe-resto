import type { PrintJob } from "./models";

export interface PrintProvider {
  enqueue(job: PrintJob): Promise<void>;
}

export interface PrintJobRepository {
  getByIdempotencyKey(key: string): Promise<PrintJob | null>;
  create(job: PrintJob): Promise<PrintJob>;
}
