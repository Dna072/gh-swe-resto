import { describe, expect, it } from "vitest";
import { notificationEventForStatus } from "./order-events";

describe("notificationEventForStatus", () => {
  it("maps kitchen and delivery statuses to guest emails", () => {
    expect(notificationEventForStatus("PAID")).toBe("ORDER_CONFIRMED");
    expect(notificationEventForStatus("PREPARING")).toBe("ORDER_PREPARING");
    expect(notificationEventForStatus("PACKING")).toBe("ORDER_PACKED");
    expect(notificationEventForStatus("READY")).toBe("ORDER_PACKED");
    expect(notificationEventForStatus("COURIER_ASSIGNED")).toBe("COURIER_ASSIGNED");
    expect(notificationEventForStatus("OUT_FOR_DELIVERY")).toBe("OUT_FOR_DELIVERY");
    expect(notificationEventForStatus("DELIVERED")).toBe("DELIVERED");
    expect(notificationEventForStatus("CANCELLED")).toBe("ORDER_CANCELLED");
    expect(notificationEventForStatus("CONFIRMED")).toBeUndefined();
  });
});
