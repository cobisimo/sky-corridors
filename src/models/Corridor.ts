import MapObject from "./MapObject";
import type { Feature, LineString, Polygon, Position } from "geojson";
import { feature } from "@turf/helpers";
import buffer from "@turf/buffer";

class Corridor extends MapObject {
  constructor(id: string, coordinates: Position[], width: number) {
    super(id, 'corridor');
    this.coordinates = coordinates;
    this.width = width;
  }
  getDrawObject(): Feature<LineString> {
    return feature({
      type: "LineString",
      coordinates: this.coordinates as Position[]
    });
  }

  getDrawPolygon(): Feature {
    const line = this.getDrawObject();
    return buffer(line, (this.width ?? 80) / 2, {
      units: "meters",
    }) as Feature<Polygon>;
  }
}

export default Corridor;
