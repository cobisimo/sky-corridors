import MapObject from "./MapObject";
import type { Feature, Polygon, Position } from "geojson";
import { feature } from "@turf/helpers";

class Obstacle extends MapObject {
  constructor(id: string, coordinates: Position[][]) {
    super(id, 'obstacle');
    this.coordinates = coordinates;
  }

  getDrawObject(): Feature<Polygon> {
    return feature({
      type: "Polygon",
      coordinates: this.coordinates as Position[][]
    });
  }

  getDrawPolygon(): Feature<Polygon> {
    return feature({
      type: "Polygon",
      coordinates: this.coordinates as Position[][]
    });
  }
}

export default Obstacle;
