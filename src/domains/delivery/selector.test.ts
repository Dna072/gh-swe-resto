import { describe, expect, it } from "vitest";
import { SandboxDeliveryProvider, SANDBOX_PROFILES } from "@/infrastructure/delivery/sandbox-provider";
import { defaultDeliverySettings } from "./models";
import { DeliveryProviderSelector } from "./selector";
import { address } from "../../../tests/unit/fixtures";

const uppsala = { ...address, lat: 59.8586, lng: 17.6389, country: "SE" };
const farAway = { ...address, lat: 40.7, lng: -74.0, city: "New York", country: "US", postalCode: "10001" };

function selector(overrides?: { woltUnavailable?: boolean; foodoraUnavailable?: boolean; customerCanSelect?: boolean }) {
  const settings = defaultDeliverySettings("uppsala-main");
  if (overrides?.customerCanSelect === false) {
    settings.customerCanSelect = false;
    settings.selectionStrategy = "cheapest";
  }
  return new DeliveryProviderSelector(
    [
      new SandboxDeliveryProvider(SANDBOX_PROFILES.wolt_drive, overrides?.woltUnavailable),
      new SandboxDeliveryProvider(SANDBOX_PROFILES.foodora, overrides?.foodoraUnavailable),
    ],
    () => settings,
  );
}

describe("DeliveryProviderSelector", () => {
  it("returns both sandbox providers in Sweden", async () => {
    const options = await selector().options({
      restaurantId: "uppsala-main",
      pickup: uppsala,
      dropoff: uppsala,
      orderValueOre: 12900,
    });
    expect(options.map((option) => option.provider).sort()).toEqual(["foodora", "wolt_drive"]);
    expect(options.find((option) => option.provider === "wolt_drive")?.providerDeliveryCostOre).toBe(7900);
    expect(options.find((option) => option.provider === "foodora")?.providerDeliveryCostOre).toBe(7500);
    expect(options.find((option) => option.provider === "wolt_drive")?.customerDeliveryFeeOre).toBe(7900);
  });

  it("hides an unavailable provider", async () => {
    const options = await selector({ foodoraUnavailable: true }).options({
      restaurantId: "uppsala-main",
      pickup: uppsala,
      dropoff: uppsala,
      orderValueOre: 0,
    });
    expect(options).toHaveLength(1);
    expect(options[0]?.provider).toBe("wolt_drive");
  });

  it("returns none outside Sweden in sandbox", async () => {
    const options = await selector().options({
      restaurantId: "uppsala-main",
      pickup: uppsala,
      dropoff: farAway,
      orderValueOre: 0,
    });
    expect(options).toHaveLength(0);
  });

  it("lets the customer pick foodora", async () => {
    const instance = selector();
    const options = await instance.options({
      restaurantId: "uppsala-main",
      pickup: uppsala,
      dropoff: uppsala,
      orderValueOre: 0,
    });
    expect(instance.pick(options, "foodora").provider).toBe("foodora");
    expect(instance.pick(options, "wolt_drive").provider).toBe("wolt_drive");
  });

  it("hides Wolt when only foodora is available", async () => {
    const options = await selector({ woltUnavailable: true }).options({
      restaurantId: "uppsala-main",
      pickup: uppsala,
      dropoff: uppsala,
      orderValueOre: 0,
    });
    expect(options).toHaveLength(1);
    expect(options[0]?.provider).toBe("foodora");
  });

  it("returns no options when neither provider can deliver", async () => {
    const options = await selector({ woltUnavailable: true, foodoraUnavailable: true }).options({
      restaurantId: "uppsala-main",
      pickup: uppsala,
      dropoff: uppsala,
      orderValueOre: 0,
    });
    expect(options).toHaveLength(0);
  });

  it("skips a provider that times out and still returns the other", async () => {
    const settings = defaultDeliverySettings("uppsala-main");
    const boom = new SandboxDeliveryProvider(SANDBOX_PROFILES.wolt_drive);
    boom.checkAvailability = async () => {
      throw new Error("timeout");
    };
    const instance = new DeliveryProviderSelector(
      [boom, new SandboxDeliveryProvider(SANDBOX_PROFILES.foodora)],
      () => settings,
    );
    const options = await instance.options({
      restaurantId: "uppsala-main",
      pickup: uppsala,
      dropoff: uppsala,
      orderValueOre: 0,
    });
    expect(options.map((option) => option.provider)).toEqual(["foodora"]);
  });

  it("fails closed when every enabled provider errors", async () => {
    const settings = defaultDeliverySettings("uppsala-main");
    const boom = new SandboxDeliveryProvider(SANDBOX_PROFILES.wolt_drive);
    boom.checkAvailability = async () => {
      throw new Error("timeout");
    };
    const boom2 = new SandboxDeliveryProvider(SANDBOX_PROFILES.foodora);
    boom2.checkAvailability = async () => {
      throw new Error("timeout");
    };
    const instance = new DeliveryProviderSelector([boom, boom2], () => settings);
    await expect(
      instance.options({
        restaurantId: "uppsala-main",
        pickup: uppsala,
        dropoff: uppsala,
        orderValueOre: 0,
      }),
    ).rejects.toThrow(/calculate the delivery cost/i);
  });
});
