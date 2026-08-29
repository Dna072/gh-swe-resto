import { describe, expect, it } from "vitest";
import { FirestoreOrderRepository } from "@/infrastructure/firestore/order-repository";

const emulator = process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!emulator)("FirestoreOrderRepository", () => {
  it("documents that repository tests run against the emulator only", () => {
    expect(FirestoreOrderRepository.name).toBe("FirestoreOrderRepository");
    expect(emulator).toBeTruthy();
  });
});
