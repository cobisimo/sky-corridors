import type { Feature, LineString, Polygon, Position } from "geojson";

export type Corridor = {
  id: string;
  centerline: Feature<LineString>;
  width: number;
  polygon: Feature<Polygon>;
  coordinates: Position[];
};

export type Obstacle = {
  id: string;
  polygon: Feature<Polygon>;
};
