declare module "@mapbox/mapbox-gl-geocoder" {
  import type { IControl } from "mapbox-gl";

  interface GeocoderOptions {
    accessToken: string;
    mapboxgl?: unknown;
    marker?: boolean;
    collapsed?: boolean;
    placeholder?: string;
    position?: string;
  }

  interface GeocoderResult {
    result: {
      center: [number, number];
      place_name: string;
      text: string;
    };
  }

  class MapboxGeocoder implements IControl {
    constructor(options: GeocoderOptions);
    on(event: string, callback: (e: GeocoderResult) => void): this;
    onAdd(map: mapboxgl.Map): HTMLElement;
    onRemove(): void;
  }

  export default MapboxGeocoder;
}
