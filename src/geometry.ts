import buffer from "@turf/buffer";
import type { Feature, LineString, Polygon } from "geojson";

export function corridorPolygon(
  centerline: Feature<LineString>,
  width: number
): Feature<Polygon> {
  return buffer(centerline, width / 2, {
    units: "meters",
  }) as Feature<Polygon>;
}
