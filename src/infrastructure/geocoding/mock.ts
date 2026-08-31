import type { AddressSnapshot } from "@/domains/shared/types";
import type { GeocodingService } from "@/domains/delivery/geocoding";
import type { GeocodedPlace, MapsPort, PlacePrediction, RouteStatus } from "@/domains/delivery/maps-port";

const DIRECTORY: AddressSnapshot[] = [
  {
    line1: "Kungsängsgatan 1",
    postalCode: "75322",
    city: "Uppsala",
    country: "SE",
    lat: 59.8581,
    lng: 17.646,
    formatted: "Kungsängsgatan 1, 75322 Uppsala",
  },
  {
    line1: "Svartbäcksgatan 1",
    postalCode: "75320",
    city: "Uppsala",
    country: "SE",
    lat: 59.862,
    lng: 17.638,
    formatted: "Svartbäcksgatan 1, 75320 Uppsala",
  },
  {
    line1: "Stora Torget 1",
    postalCode: "75310",
    city: "Uppsala",
    country: "SE",
    lat: 59.8586,
    lng: 17.6389,
    formatted: "Stora Torget 1, 75310 Uppsala",
  },
  {
    line1: "Östra Ågatan 11",
    postalCode: "75322",
    city: "Uppsala",
    municipality: "Uppsala",
    country: "SE",
    lat: 59.8572,
    lng: 17.6468,
    formatted: "Östra Ågatan 11, 75322 Uppsala",
    apartment: "2 tr",
    line2: "Lgh 1201",
  },
  {
    line1: "Västra Ågatan 8",
    postalCode: "75318",
    city: "Uppsala",
    municipality: "Uppsala",
    country: "SE",
    lat: 59.8591,
    lng: 17.632,
    formatted: "Västra Ågatan 8, 75318 Uppsala",
  },
];

function matches(query: string, address: AddressSnapshot): boolean {
  const hay = `${address.line1} ${address.postalCode} ${address.city}`.toLocaleLowerCase("sv-SE");
  return hay.includes(query.trim().toLocaleLowerCase("sv-SE"));
}

/** Offline geocoder for tests and environments without a live OSM key. */
export class MockGeocodingService implements GeocodingService, MapsPort {
  async searchAddress(query: string): Promise<PlacePrediction[]> {
    if (query.trim().length < 3) {
      return [];
    }
    return DIRECTORY.filter((entry) => matches(query, entry)).map((entry) => ({
      placeId: `mock:${entry.line1}`,
      description: entry.formatted ?? entry.line1,
    }));
  }

  async geocodeAddress(address: AddressSnapshot): Promise<GeocodedPlace | null> {
    const match =
      DIRECTORY.find((entry) => entry.line1 === address.line1) ??
      DIRECTORY.find((entry) => entry.postalCode === address.postalCode.replace(/\s+/g, ""));
    if (!match?.lat || !match.lng) {
      if (address.lat != null && address.lng != null) {
        return {
          formattedAddress: address.formatted ?? address.line1,
          lat: address.lat,
          lng: address.lng,
          types: [],
          addressComponents: [],
        };
      }
      const postal = address.postalCode.replace(/\s+/g, "");
      if (postal && postal !== "00000" && !postal.startsWith("75")) {
        return {
          formattedAddress: [address.line1, address.postalCode, address.city].join(", "),
          lat: 59.3293,
          lng: 18.0686,
          types: [],
          addressComponents: [],
        };
      }
      return {
        formattedAddress: [address.line1, address.postalCode, address.city].join(", "),
        lat: 59.8586,
        lng: 17.6389,
        types: [],
        addressComponents: [],
      };
    }
    return {
      formattedAddress: match.formatted ?? match.line1,
      lat: match.lat,
      lng: match.lng,
      types: [],
      addressComponents: [],
    };
  }

  async reverseGeocode(lat: number, lng: number): Promise<AddressSnapshot | null> {
    const nearest = DIRECTORY[0];
    if (!nearest) {
      return null;
    }
    return { ...nearest, lat, lng, formatted: `${nearest.line1} (${lat.toFixed(5)}, ${lng.toFixed(5)})` };
  }

  async placeDetails(placeId: string): Promise<(AddressSnapshot & { types: string[]; addressComponents: GeocodedPlace["addressComponents"] }) | null> {
    const line1 = placeId.replace(/^mock:/, "");
    const match = DIRECTORY.find((entry) => entry.line1 === line1);
    if (!match) {
      return null;
    }
    return { ...match, types: [], addressComponents: [] };
  }

  async autocomplete(input: string): Promise<PlacePrediction[]> {
    return this.searchAddress(input);
  }

  async geocode(address: AddressSnapshot): Promise<GeocodedPlace | null> {
    return this.geocodeAddress(address);
  }

  async routeStatus(): Promise<RouteStatus> {
    return "ok";
  }
}
