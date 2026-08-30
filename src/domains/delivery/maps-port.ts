import type { AddressSnapshot } from "@/domains/shared/types";

export type GeocodedPlace = {
  formattedAddress: string;
  lat: number;
  lng: number;
  types: string[];
  addressComponents: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
};

export type PlacePrediction = {
  placeId: string;
  description: string;
};

export type RouteStatus = "ok" | "out_of_zone" | "unavailable";

export interface MapsPort {
  geocode(address: AddressSnapshot): Promise<GeocodedPlace | null>;
  routeStatus(origin: AddressSnapshot, destination: { lat: number; lng: number }): Promise<RouteStatus>;
  autocomplete(
    input: string,
    options: { language: string; sessionToken?: string },
  ): Promise<PlacePrediction[]>;
  placeDetails(
    placeId: string,
    options: { language: string; sessionToken?: string },
  ): Promise<(AddressSnapshot & { types: string[]; addressComponents: GeocodedPlace["addressComponents"] }) | null>;
}
