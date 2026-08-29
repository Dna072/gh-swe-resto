import type { NotificationChannel, NotificationMessage } from "./models";

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(message: NotificationMessage): Promise<void>;
}

export interface NotificationDedupStore {
  seen(idempotencyKey: string): Promise<boolean>;
  mark(idempotencyKey: string): Promise<void>;
}
