import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { MapMouseEvent } from "mapbox-gl";
import type { GeoJSON } from "geojson";
import type {
  DrawCustomMode,
  DrawCustomModeThis,
  DrawFeature,
} from "@mapbox/mapbox-gl-draw";

interface DrawLineState {
  line: DrawFeature;
  pointCount: number;
}

const TwoPointLineMode: DrawCustomMode<DrawLineState> = {
  ...MapboxDraw.modes.draw_line_string,

  onSetup(this: DrawCustomModeThis) {
    const line = this.newFeature({
      type: "Feature",
      properties: {
        active: 'true'
      },
      geometry: {
        type: "LineString",
        coordinates: [],
      },
    });
    this.addFeature(line);
    this.clearSelectedFeatures();

    return {
      line,
      pointCount: 0
    };
  },

  // Use the standard 'onClick'
  onClick(this: DrawCustomModeThis, state: DrawLineState, e: MapMouseEvent) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    state.pointCount++;

    if (state.pointCount === 1) {
      // Initialize with two identical points
      state.line.setCoordinates([coords, coords]);
    } else if (state.pointCount === 2) {
      state.line.setCoordinates([state.line.getCoordinates()[0], coords]);

      // Fire the event for React
      this.map.fire("draw.create", {
        features: [state.line.toGeoJSON()]
      });

      // this.changeMode("simple_select", { featureIds: [state.line.id] });
    }
  },

  onMouseMove(this: DrawCustomModeThis, state: DrawLineState, e: MapMouseEvent) {
    if (state.pointCount === 1) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      // Update only the second point while moving
      const startPoint = state.line.getCoordinates()[0];
      state.line.setCoordinates([startPoint, coords]);
    }
  },

  toDisplayFeatures(this: DrawCustomModeThis, state: DrawLineState, geojson: GeoJSON, display: (geojson: GeoJSON) => void) {
    if (geojson.properties.id === state.line.id) {
      geojson.properties.active = 'true';
      display(geojson);
    } else {
      display(geojson);
    }
  }
};

export default TwoPointLineMode;
