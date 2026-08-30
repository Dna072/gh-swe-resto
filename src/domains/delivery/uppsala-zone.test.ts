import { describe, expect, it } from "vitest";
import type { GeocodedPlace, MapsPort } from "./maps-port";
import { isUppsalaPlace, looksLikeUppsala, resolveUppsalaDropoff } from "./uppsala-zone";

function place(partial: Partial<GeocodedPlace> & Pick<GeocodedPlace, "formattedAddress">): GeocodedPlace {
  return {
    lat: 59.8586,
    lng: 17.6389,
    types: ["street_address"],
    addressComponents: [],
    ...partial,
  };
}

describe("Uppsala delivery zone", () => {
  it("accepts Uppsala city and 75xxx postcodes without Maps", () => {
    expect(looksLikeUppsala({ line1: "Svartbäcksgatan 1", postalCode: "75322", city: "Uppsala", country: "SE" })).toBe(
      true,
    );
    expect(looksLikeUppsala({ line1: "Test", postalCode: "11122", city: "Stockholm", country: "SE" })).toBe(false);
    expect(looksLikeUppsala({ line1: "Kungsgatan 1", postalCode: "74539", city: "Enköping", country: "SE" })).toBe(
      false,
    );
  });

  it("reads Google address components instead of a frontend polygon", () => {
    expect(
      isUppsalaPlace(
        place({
          formattedAddress: "Svartbäcksgatan 1, 753 32 Uppsala, Sweden",
          addressComponents: [
            { longName: "Uppsala", shortName: "Uppsala", types: ["postal_town"] },
            { longName: "753 32", shortName: "753 32", types: ["postal_code"] },
            { longName: "Uppsala kommun", shortName: "Uppsala kommun", types: ["administrative_area_level_2"] },
          ],
        }),
      ),
    ).toBe(true);

    expect(
      isUppsalaPlace(
        place({
          formattedAddress: "Drottninggatan 1, 111 51 Stockholm, Sweden",
          lat: 59.3293,
          lng: 18.0686,
          addressComponents: [
            { longName: "Stockholm", shortName: "Stockholm", types: ["postal_town"] },
            { longName: "111 51", shortName: "111 51", types: ["postal_code"] },
            { longName: "Stockholms kommun", shortName: "Stockholms kommun", types: ["administrative_area_level_2"] },
          ],
        }),
      ),
    ).toBe(false);

    expect(
      isUppsalaPlace(
        place({
          formattedAddress: "Kungsgatan 1, 745 39 Enköping, Sweden",
          addressComponents: [
            { longName: "Enköping", shortName: "Enköping", types: ["postal_town"] },
            { longName: "745 39", shortName: "745 39", types: ["postal_code"] },
            { longName: "Enköpings kommun", shortName: "Enköpings kommun", types: ["administrative_area_level_2"] },
            { longName: "Uppsala län", shortName: "C", types: ["administrative_area_level_1"] },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("rejects non-Uppsala addresses when Maps is not configured", async () => {
    await expect(
      resolveUppsalaDropoff({ line1: "Drottninggatan 1", postalCode: "11151", city: "Stockholm", country: "SE" }),
    ).rejects.toThrow(/Uppsala/i);
  });

  it("uses geocode + route status when a Maps port is provided", async () => {
    const maps: MapsPort = {
      geocode: async () =>
        place({
          formattedAddress: "Kungsängsgatan 2, 753 22 Uppsala, Sweden",
          lat: 59.855,
          lng: 17.646,
          addressComponents: [
            { longName: "Kungsängsgatan", shortName: "Kungsängsgatan", types: ["route"] },
            { longName: "2", shortName: "2", types: ["street_number"] },
            { longName: "Uppsala", shortName: "Uppsala", types: ["postal_town"] },
            { longName: "753 22", shortName: "753 22", types: ["postal_code"] },
          ],
        }),
      routeStatus: async () => "ok",
      autocomplete: async () => [],
      placeDetails: async () => null,
    };

    const resolved = await resolveUppsalaDropoff(
      { line1: "Kungsängsgatan 2", postalCode: "75322", city: "Uppsala", country: "SE" },
      maps,
    );
    expect(resolved.lat).toBe(59.855);
    expect(resolved.city).toBe("Uppsala");
    expect(resolved.line1).toBe("Kungsängsgatan 2");
  });
});
