import nearestPointOnLine from "@turf/nearest-point-on-line";
import distance from "@turf/distance";
import { point } from "@turf/helpers";

const SNAP_DISTANCE_METERS = 25;

export function snapToCorridors(
  lngLat: [number, number],
  corridors: Corridor[]
): [number, number] {
  let closest = lngLat;
  let minDist = SNAP_DISTANCE_METERS;

  for (const c of corridors) {
    const snap = nearestPointOnLine(
      c.centerline,
      point(lngLat),
      { units: "meters" }
    );

    const d = distance(point(lngLat), snap, { units: "meters" });

    if (d < minDist) {
      minDist = d;
      closest = snap.geometry.coordinates as [number, number];
    }
  }

  return closest;
}
