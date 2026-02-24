import MapObject from "./MapObject";
import type { Feature, Point, Position } from "geojson";
import { feature } from "@turf/helpers";

class Landing extends MapObject {
  constructor(id: string, coordinates: Position) {
    super(id, 'landing_point');
    this.coordinates = coordinates;
  }

  getDrawObject(): Feature<Point> {
    return feature({
      type: "Point",
      coordinates: this.coordinates as Position
    });
  }

  getDrawPolygon(): Feature<Point> {
    return feature({
      type: "Point",
      coordinates: this.coordinates as Position
    });
  }
}

export default Landing;
