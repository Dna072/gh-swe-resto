import { describe, expect, it } from "vitest";
import { MockDeliveryProvider } from "@/infrastructure/delivery/mock-provider";
import { DeliveryService } from "./service";
import { address } from "../../../tests/unit/fixtures";
import type { DeliveryZone } from "./models";

const zone: DeliveryZone = {
  id: "uppsala-center",
  restaurantId: "uppsala-main",
  name: "Uppsala centrum",
  postalCodes: ["75320", "75321"],
  baseFeeOre: 4900,
  etaMinutes: 35,
  active: true,
  providers: ["mock"],
};

describe("DeliveryService", () => {
  it("validates configurable zones instead of hard-coded frontend postcodes", () => {
    const service = new DeliveryService([new MockDeliveryProvider()], {
      preferCheapest: true,
      preferredProviders: ["wolt_drive"],
    });
    expect(service.validateZone(address, [zone]).id).toBe("uppsala-center");
    expect(() =>
      service.validateZone({ ...address, postalCode: "11122" }, [zone]),
    ).toThrow(/do not deliver/i);
  });

  it("can fall back to a city-wide zone when Maps already confirmed Uppsala", () => {
    const south: DeliveryZone = {
      ...zone,
      id: "uppsala-south",
      name: "Södra Uppsala",
      postalCodes: ["75643"],
      baseFeeOre: 5900,
    };
    const service = new DeliveryService([new MockDeliveryProvider()], {
      preferCheapest: true,
      preferredProviders: ["wolt_drive"],
    });
    expect(
      service.validateZone({ ...address, postalCode: "74330" }, [zone, south], { allowCityWide: true }).id,
    ).toBe("uppsala-south");
  });

  it("selects the cheapest valid quote", async () => {
    const service = new DeliveryService([new MockDeliveryProvider()], {
      preferCheapest: true,
      preferredProviders: ["wolt_drive"],
    });
    const quote = await service.quote(
      {
        restaurantId: "uppsala-main",
        pickup: address,
        dropoff: address,
        orderValueOre: 14900,
      },
      zone,
    );
    expect(quote.feeOre).toBe(4900);
    expect(quote.provider).toBe("mock");
  });
});
