import { Feature, LineString, Polygon } from "geojson";

export type Corridor = {
  id: string;
  centerline: Feature<LineString>;
  widthMeters: number;
  polygon: Feature<Polygon>;
};

