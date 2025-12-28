import MapboxDraw from "@mapbox/mapbox-gl-draw";

const TwoPointLineMode = {
  ...MapboxDraw.modes.draw_line_string,

  onSetup() {
    const state =
      MapboxDraw.modes.draw_line_string.onSetup.call(this);
    state.currentVertexPosition = 0;
    return state;
  },

  clickAnywhere(state, e) {
    const coords: [number, number] = [
      e.lngLat.lng,
      e.lngLat.lat,
    ];

    state.line.coordinates[state.currentVertexPosition] = coords;
    state.currentVertexPosition++;

    const geo = state.line.toGeoJSON();

    // redraw preview
    this.map.fire("draw.update", {
      features: [geo],
    });

    // finish after exactly 2 points
    if (state.currentVertexPosition === 2) {
      this.map.fire("draw.create", {
        features: [geo],
      });

      this.changeMode("simple_select", {
        featureIds: [state.line.id],
      });
    }
  },

  dblClickAnywhere() {
    return;
  },

  onStop(state) {
    if (state.line.coordinates.length < 2) {
      this.deleteFeature([state.line.id]);
    }
  },
};

export default TwoPointLineMode;
