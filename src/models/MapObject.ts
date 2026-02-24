import type { Position } from "geojson";

type ObjectType = 'corridor' | 'obstacle' | 'landing_point';

abstract class MapObject {
  id: string;
  type: ObjectType;
  width?: number;
  coordinates: Position | Position[] | Position[][] = [];

  constructor(id: string, type: ObjectType) {
    this.id = id;
    this.type = type;
  }
}

export default MapObject;
