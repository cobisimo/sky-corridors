import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import distance from "@turf/distance";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { v4 as uuid } from "uuid";
import { point } from "@turf/helpers";
import { featureCollection } from "@turf/helpers";

import { Corridor } from "./types";
import { api } from "./api";
import { corridorPolygon } from "./geometry";
import { snapToCorridors } from "./snapping";
import TwoPointLineMode from "./TwoPointLineMode";

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "maplibre-gl/dist/maplibre-gl.css";

function findClosestCorridor(lngLat: { lng: number; lat: number }, corridors: any[]) {
  let minDist = Infinity;
  let closest: any = null;

  const clickPoint = point([lngLat.lng, lngLat.lat]);

  for (const corridor of corridors) {
    const line = corridor.centerline; // GeoJSON LineString
    const turfLine = line; // assuming already GeoJSON LineString

    // Turf distance from click to line
    const dist = distance(clickPoint, nearestPointOnLine(turfLine, clickPoint), { units: 'meters' });

    if (dist < minDist) {
      minDist = dist;
      closest = corridor;
    }
  }

  return closest;
}

export default function CorridorMap() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [selected, setSelected] = useState<Corridor | null>(null);
  const [width, setWidth] = useState(80);

  /* ---------- init map ---------- */
  useEffect(() => {
    const map = new maplibregl.Map({
      container: "map",
      style: "https://demotiles.maplibre.org/style.json",
      center: [20.46, 44.81],
      zoom: 12,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true,
      },

      styles: [
        // ===== LINESTRING (inactive) =====
        {
          id: "gl-draw-line-inactive",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "LineString"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "line-color": "#ff3333",
            "line-width": 2,
          },
        },

        // ===== LINESTRING (active) =====
        {
          id: "gl-draw-line-active",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "LineString"],
            ["==", "active", "true"],
          ],
          paint: {
            "line-color": "#ff3333",
            "line-width": 2,
          },
        },

        // ===== VERTEX POINTS =====
        {
          id: "gl-draw-points",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ff3333",
          },
        },
      ],

      modes: {
        ...MapboxDraw.modes,
        draw_two_point_line: TwoPointLineMode,
      },
    });


    map.addControl(draw);
    map.addControl(new maplibregl.NavigationControl());

    map.on("load", async () => {
      map.addSource("corridors", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "corridor-polygons",
        type: "fill",
        source: "corridors",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "#00BFFF",
          "fill-opacity": 0.3,
        },
      });

      map.addLayer({
        id: "corridor-centerlines",
        type: "line",
        source: "corridors",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "#003366",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });

      const data = await api.list();
      setCorridors(data);
      // draw.changeMode("draw_line_string");
    });

    map.on("draw.create", e => {
      const centerline = e.features[0];
      const polygon = corridorPolygon(centerline, width);

      const corridor: Corridor = {
        id: uuid(),
        centerline,
        widthMeters: width,
        polygon,
      };

      api.create(corridor);
      setCorridors(c => [...c, corridor]);
      draw.deleteAll();
    });

    mapRef.current = map;
    drawRef.current = draw;

    return () => map.remove();
  }, [width]);

  /* ---------- update map source ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource("corridors") as maplibregl.GeoJSONSource;
    if (!src) return;

    src.setData({
      type: "FeatureCollection",
      features: corridors.flatMap(c => [c.polygon, c.centerline]),
    });
  }, [corridors]);

  /* ---------- select corridor ---------- */
  useEffect(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["corridor-polygons"],
      });

      if (!features.length) return;

      const poly = features[0];
      const corridor = corridors.find(c => c.polygon.id === poly.id);
      if (!corridor) return;

      setSelected(corridor);
      setWidth(corridor.widthMeters);

      draw.deleteAll();
      draw.add(corridor.centerline);

      // const [featureId] = draw.add(corridor.centerline);
      // draw.changeMode("direct_select", {
      //   featureId,
      // });
      //
      const closest = findClosestCorridor(e.lngLat, corridors); // your corridor array
      if (!closest) return;

      console.log(closest);

      draw.changeMode("simple_select", {
        featureIds: [closest.centerline.id],
      });
    };

    map.on("click", onClick);

    // map.on("mousemove", (e) => {
    //   const closest = findClosestCorridor(e.lngLat, corridors);
    //   if (closest) {
    //     draw.setFeatureProperty(closest.id, "hover", true);
    //   }
    // });

    return () => map.off("click", onClick);
  }, [corridors]);

  /* ---------- update selected corridor ---------- */
  function updateSelected() {
    if (!selected || !drawRef.current) return;

    const features = drawRef.current.getAll().features;
    if (!features.length) return;

    const centerline = features[0];
    const polygon = corridorPolygon(centerline, width);

    const updated: Corridor = {
      ...selected,
      centerline,
      widthMeters: width,
      polygon,
    };

    api.update(updated);
    setCorridors(cs => cs.map(c => (c.id === updated.id ? updated : c)));
    setSelected(null);
    drawRef.current.deleteAll();
  }

  /* ---------- delete ---------- */
  function removeSelected() {
    if (!selected) return;

    api.remove(selected.id);
    setCorridors(cs => cs.filter(c => c.id !== selected.id));
    setSelected(null);
    drawRef.current?.deleteAll();
  }

  return (
    <>
      <div id="map" style={{ height: "100vh" }} />

      <div className="panel">
        <h3>Sky Corridors</h3>

        <label>
          Width (meters)
          <input
            type="number"
            value={width}
            onChange={e => setWidth(+e.target.value)}
          />
        </label>

        {selected && (
          <>
            <button onClick={updateSelected}>Save changes</button>
            <button onClick={removeSelected} style={{ color: "red" }}>
              Delete corridor
            </button>
          </>
        )}

        {!selected && (
          <>
            <button
              // onClick={() => drawRef.current?.changeMode("draw_line_string")}>
              onClick={() => drawRef.current?.changeMode("draw_two_point_line")}>
              Draw corridor
            </button>
            <p>Draw a line to create a corridor</p>
          </>
        )}
      </div>
    </>
  );
}
