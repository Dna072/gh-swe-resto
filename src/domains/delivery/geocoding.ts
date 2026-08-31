import type { AddressSnapshot } from "@/domains/shared/types";
import type { GeocodedPlace, PlacePrediction } from "./maps-port";

export interface GeocodingService {
  searchAddress(
    query: string,
    options: { language: string; sessionToken?: string },
  ): Promise<PlacePrediction[]>;
  geocodeAddress(address: AddressSnapshot): Promise<GeocodedPlace | null>;
  reverseGeocode(lat: number, lng: number, language?: string): Promise<AddressSnapshot | null>;
  placeDetails(
    placeId: string,
    options: { language: string; sessionToken?: string },
  ): Promise<AddressSnapshot | null>;
}
