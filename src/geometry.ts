import buffer from "@turf/buffer";
import { Feature, LineString, Polygon } from "geojson";

export function corridorPolygon(
  centerline: Feature<LineString>,
  widthMeters: number
): Feature<Polygon> {
  return buffer(centerline, widthMeters / 2, {
    units: "meters",
  }) as Feature<Polygon>;
}

