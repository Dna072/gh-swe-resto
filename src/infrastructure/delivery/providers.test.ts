import { afterEach, describe, expect, it, vi } from "vitest";
import { hmacSha256Hex } from "@/lib/hash";
import { SandboxDeliveryProvider, SANDBOX_PROFILES } from "./sandbox-provider";
import { FoodoraProvider } from "./foodora-provider";
import { WoltDriveProvider } from "./wolt-drive-provider";
import { address } from "../../../tests/unit/fixtures";

const uppsala = { ...address, lat: 59.8586, lng: 17.6389, country: "SE" as const };
const request = {
  restaurantId: "uppsala-main",
  pickup: uppsala,
  dropoff: uppsala,
  orderValueOre: 12900,
};

describe("sandbox last-mile adapters", () => {
  it("creates a delivery only once for the same idempotency key", async () => {
    const provider = new SandboxDeliveryProvider(SANDBOX_PROFILES.wolt_drive);
    const payload = {
      orderId: "ord_1",
      quoteId: "q1",
      pickup: uppsala,
      dropoff: uppsala,
      idempotencyKey: "delivery:ord_1",
      customerName: "Ama",
      customerPhone: "+46700000000",
      instructions: "Ring the bell.",
    };
    const first = await provider.createDelivery(payload);
    const second = await provider.createDelivery(payload);
    expect(second.providerDeliveryId).toBe(first.providerDeliveryId);
    expect(second.id).toBe(first.id);
  });

  it("quotes Wolt and foodora sandbox profiles separately", async () => {
    const wolt = await new SandboxDeliveryProvider(SANDBOX_PROFILES.wolt_drive).getQuote(request);
    const foodora = await new SandboxDeliveryProvider(SANDBOX_PROFILES.foodora).getQuote(request);
    expect(wolt.providerDeliveryCostOre).toBe(7900);
    expect(wolt.etaMinutes).toBe(35);
    expect(foodora.providerDeliveryCostOre).toBe(7500);
    expect(foodora.etaMinutes).toBe(30);
    expect(wolt.expiresAt).toBeTruthy();
  });
});

describe("live adapters without invented APIs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("keeps unconfigured Wolt unavailable", async () => {
    const wolt = new WoltDriveProvider();
    await expect(wolt.getQuote(request)).rejects.toThrow(/not configured/i);
    expect(await wolt.checkAvailability(request)).toBe(false);
  });

  it("does not fabricate a foodora quote API", async () => {
    const foodora = new FoodoraProvider("dummy-key");
    expect(foodora.capabilities.supportsQuote).toBe(false);
    expect(await foodora.checkAvailability()).toBe(false);
    await expect(foodora.getQuote(request)).rejects.toThrow(/unavailable/i);
  });

  it("maps a Wolt shipment-promise payload conservatively", async () => {
    const wolt = new WoltDriveProvider({
      apiBaseUrl: "https://example.invalid",
      venueId: "venue",
      apiKey: "key",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "promise_1",
        price: { amount: 7900, currency: "SEK" },
        time_estimate_minutes: 35,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const quote = await wolt.getQuote(request);
    expect(quote.quoteId).toBe("promise_1");
    expect(quote.providerDeliveryCostOre).toBe(7900);
  });

  it("treats an invalid Wolt payload as unavailable", async () => {
    const wolt = new WoltDriveProvider({
      apiBaseUrl: "https://example.invalid",
      venueId: "venue",
      apiKey: "key",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: true }),
      }),
    );
    await expect(wolt.getQuote(request)).rejects.toThrow(/unavailable/i);
  });
});

describe("sandbox webhooks", () => {
  it("accepts a signed event and rejects a bad signature", async () => {
    const provider = new SandboxDeliveryProvider(SANDBOX_PROFILES.foodora);
    const body = JSON.stringify({ id: "del_1", status: "delivered", event_id: "evt_1" });
    const signature = hmacSha256Hex("sandbox-webhook-secret", body);
    const event = await provider.handleWebhook(body, { "x-signature": signature });
    expect(event.status).toBe("DELIVERED");
    expect(event.unknown).toBe(false);
    await expect(provider.handleWebhook(body, { "x-signature": "deadbeef" })).rejects.toThrow(/signature/i);
  });
});
