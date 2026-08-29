import { logger } from "@/lib/logging/logger";
import type { PrintJob } from "@/domains/printing/models";
import type { PrintProvider } from "@/domains/printing/provider";

export class BrowserPrintProvider implements PrintProvider {
  async enqueue(job: PrintJob): Promise<void> {
    logger.info("Browser print job prepared", { printJobId: job.id, orderId: job.orderId });
  }
}

export class CloudTaskPrintProvider implements PrintProvider {
  async enqueue(job: PrintJob): Promise<void> {
    logger.info("Print job would be enqueued on Cloud Tasks", {
      printJobId: job.id,
      orderId: job.orderId,
    });
  }
}
