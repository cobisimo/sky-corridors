import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import Map, { Source, Layer, Popup, useControl, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { v4 as uuid } from "uuid";
import type { Feature, LineString, Polygon } from "geojson";

import { type Corridor, type Obstacle } from "./types";
import { api } from "./api";
import { corridorPolygon } from "./geometry";
import TwoPointLineMode from "./TwoPointLineMode";

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { MousePointer2, OctagonMinus, Plane, RectangleEllipsis } from "lucide-react"
import { Button } from "./components/ui/button";
import { feature } from "@turf/helpers";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const API_KEY = '42QKswNbGPVp1Pd4nR7N';

interface IHoveredObstacle {
  lngLat: maplibregl.LngLat;
  height: string;
  elevation: string;
  classification: string;
};

const DrawMode = {
  SELECT: "select",
  DRAW_CORRIDOR: "drawCorridor",
  DRAW_OBSTACLE: "drawObstacle",
} as const;

type DrawMode = typeof DrawMode[keyof typeof DrawMode];

function DrawControl({ drawRef, ...props }: any) {
  const draw = useMemo(() => {
    return new MapboxDraw(props);
  }, []);

  useControl(
    () => draw,
    ({ map }: { map: MapRef }) => {
      map.on('draw.create', props.onCreate);
      map.on('draw.update', props.onUpdate);
      map.on('draw.delete', props.onDelete);
      map.on('draw.selectionchange', props.onSelectionChange);
      drawRef.current = draw;
    },
    ({ map }: { map: MapRef }) => {
      // Cleanup events
      map.off('draw.create', props.onCreate);
      map.off('draw.update', props.onUpdate);
      map.off('draw.delete', props.onDelete);
      map.off('draw.selectionchange', props.onSelectionChange);
      drawRef.current = null;
    },
    {
      position: props.position || 'top-right'
    }
  );

  return null;
}

export default function CorridorMap() {
  const [corridors, setCorridors] = useState<any[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>(DrawMode.SELECT);
  const [selected, setSelected] = useState<Corridor | null>(null);
  const [changed, setChanged] = useState(false);
  const [width, setWidth] = useState(80);
  const [hoverInfo, setHoverInfo] = useState<IHoveredObstacle | null>(null);

  const drawRef = useRef<MapboxDraw | null>(null);
  const drawModeRef = useRef<DrawMode>(drawMode);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    let isMounted = true; // Prevents memory leaks
    const fetchData = async () => {
      try {
        const c = await api.listCorridors();
        const cc = c.map(corridor => {
          const centerline: Feature<LineString> = feature({
            type: "LineString",
            coordinates: corridor.coordinates
          }) as Feature<LineString>;
          return {
            id: corridor.id || uuid(),
            centerline,
            polygon: corridorPolygon(centerline, corridor.width ?? 80)
          }
        });
        if (isMounted) {
          setCorridors(cc);
        }

        const o = await api.listObstacles();
        const oc = o.map(obstacle => {
          const polygon: Feature<Polygon> = feature({
            type: "Polygon",
            coordinates: obstacle.coordinates
          }) as Feature<Polygon>;
          return {
            id: obstacle.id || uuid(),
            polygon
          }
        });
        console.log("Obstacles:", oc);
        if (isMounted) {
          setObstacles(oc);
        }
      } catch (err) {
        console.error("Failed to load corridors:", err);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    console.log('State updated! Corridors are now:', corridors);
  }, [corridors]);

  function updateSelected() {
    if (!selected || !drawRef.current) return;

    const features = drawRef.current.getAll().features;
    if (!features.length) return;

    const centerline = features[0];
    const polygon = corridorPolygon(centerline, width);

    const updated: Corridor = {
      ...selected,
      centerline,
      width,
      polygon,
    };

    api.updateCorridor(updated);
    setCorridors(cs => cs.map(c => (c.id === updated.id ? updated : c)));
    setSelected(null);
    drawRef.current.deleteAll();
  }

  function removeSelected() {
    if (!selected) return;

    api.removeCorridor(selected.id);
    setCorridors(cs => cs.filter(c => c.id !== selected.id));
    setSelected(null);
    drawRef.current?.deleteAll();
  }

  const onHover = (event: maplibregl.MapLayerMouseEvent) => {
    const { features, lngLat, target: map } = event;
    const hoveredFeature = features && features[0];
    if (!hoveredFeature || !hoveredFeature.properties.height) {
      setHoverInfo(null);
      return;
    }

    const elevation = map.queryTerrainElevation(lngLat)?.toFixed(2);
    const classification = [hoveredFeature.properties.class, hoveredFeature.properties.subclass].filter(Boolean);

    setHoverInfo({
      lngLat: lngLat,
      height: hoveredFeature.properties.height,
      elevation: elevation ?? '0',
      classification: classification.length ? classification.join('/') : 'building'
    });
  };

  const onCreate = (e: any) => {
    if (!drawRef.current) return;

    const features = e.features;

    if (drawModeRef.current === DrawMode.DRAW_CORRIDOR) {
      const centerline = features[0];
      const polygon = corridorPolygon(centerline, width);

      console.log('centerline', features[0]);

      const corridor: Corridor = {
        id: uuid(),
        centerline,
        width,
        polygon,
      };

      api.createCorridor(corridor);
      setCorridors(prev => [...prev, corridor]); // Functional update
      drawRef.current.deleteAll();

    } else if (drawModeRef.current === DrawMode.DRAW_OBSTACLE) {
      const obstacle: Obstacle = {
        id: uuid(),
        polygon: features[0],
      };

      api.createObstacle(obstacle);
      setObstacles(prev => [...prev, obstacle]); // Functional update
      drawRef.current.deleteAll();
    }

    setDrawMode(DrawMode.SELECT);
  };

  const onSelectionChange = (e: any) => {
    setSelected(e.features[0] ? e.features[0] : null);
    // const selected = e.features[0];
    // if (selected) {
    //   const corridorData = corridors.find(c => c.id === selected.id);
    //   if (corridorData) {
    //     // Set some state to show info in a Card/Sidebar
    //     setSelected(corridorData);
    //   }
    // }
  };

  // Make drawMode in sync
  useEffect(() => {
    if (!drawRef || !drawRef.current) return;

    switch (drawMode) {
      case DrawMode.DRAW_CORRIDOR:
        drawRef.current.changeMode("draw_two_point_line");
        break;
      case DrawMode.DRAW_OBSTACLE:
        drawRef.current.changeMode("draw_polygon");
        break;
      default:
        drawRef.current.changeMode("simple_select");
        break;
    }
  }, [drawMode]);

  // Add corridors to draw layer
  useEffect(() => {
    if (!drawRef || !drawRef.current || !corridors.length) return;
    corridors.forEach((corridor) => {
      const existing = drawRef.current.get(corridor.id);
      if (!existing) {
        drawRef.current.add({
          ...corridor.centerline,
          id: corridor.id,
        });
      }
    });
  }, [corridors]);

  // Add obstacles to draw layer
  useEffect(() => {
    if (!drawRef || !drawRef.current || !obstacles.length) return;
    obstacles.forEach((obstacle) => {
      const existing = drawRef.current.get(obstacle.id);
      if (!existing) {
        drawRef.current.add({
          ...obstacle.polygon,
          id: obstacle.id,
        });
      }
    });
  }, [obstacles]);

  return (
    <>
      <Map
        initialViewState={{
          longitude: 20.35,
          latitude: 43.89,
          zoom: 12
        }}
        style={{ width: '100vw', height: '100vh' }}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        terrain={{ source: 'raster-dem', exaggeration: 1.5 }}
        interactiveLayerIds={['buildings-layer']}
        onMouseMove={onHover}
      >
        <Source
          id="raster-dem"
          type="raster-dem"
          encoding="mapbox"
          url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${API_KEY}`}
          tileSize={256}
        />
        <Source
          type="vector"
          url={`https://api.maptiler.com/tiles/buildings/tiles.json?key=${API_KEY}`}>
          <Layer
            id="buildings-layer"
            type="fill"
            source-layer="building"
            paint={{
              'fill-color': [
                'match',
                ['get', 'class'],
                'medical', '#ff4d4d',
                'education', '#ffcc00',
                'religious', '#ff9900',
                '#aaa'
              ],
              'fill-opacity': 0.6,
              'fill-outline-color': '#888'
            }}
          />
        </Source>
        <Source
          type="geojson"
          data={{
            type: "FeatureCollection",
            // Extract just the polygon GeoJSON features from your state
            features: corridors.map(c => ({
              ...c.polygon,
              id: c.id // Ensure the ID is attached to the feature for hover/selection
            })),
          }}
        >
          <Layer
            id="corridor-fill"
            type="fill"
            // This filter is good, it ensures we only try to fill actual polygons
            filter={["==", "$type", "Polygon"]}
            paint={{
              "fill-color": "#003366",
              "fill-opacity": 0.5, // Added opacity so you can see the map/buildings under it
            }}
          />
          <Layer
            id="corridor-outline"
            type="line"
            paint={{
              "line-color": "#003366",
              "line-width": 2
            }}
          />
        </Source>
        <Source
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: obstacles.map(o => ({
              ...o.polygon,
              id: o.id
            })),
          }}>
          <Layer
            id="obstacle-polygons"
            type="fill"
            filter={["==", "$type", "Polygon"]}
            paint={{
              "fill-color": "#ff4d4f",
              "fill-opacity": 0.3,
            }}
          />
        </Source>
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lngLat.lng}
            latitude={hoverInfo.lngLat.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={10}
          >
            <div className="p-1">
              <strong>Висина објекта:</strong> {hoverInfo.height} m<br />
              <strong>Надморска висина:</strong> {hoverInfo.elevation} m<br />
              <strong>Врста:</strong> {hoverInfo.classification}
            </div >
          </Popup>
        )}
        <DrawControl
          drawRef={drawRef}
          displayControlsDefault={false}
          styles={customStyles}
          modes={{
            ...MapboxDraw.modes,
            draw_two_point_line: TwoPointLineMode,
          }}
          onCreate={onCreate}
          onSelectionChange={onSelectionChange}
          onUpdate={() => setChanged(true)}
        />
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
      <Card className="fixed top-5 left-5 w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex flex-row"><Plane className="mr-2" /><span className="self-center">Ваздушни коридори</span></CardTitle>
          <CardDescription>
            Изаберите режим за изградњу коридора или препреке.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-col gap-2">
          <ToggleGroup type="single" value={drawMode} variant="outline" onValueChange={(value: DrawMode) => setDrawMode(value)}>
            <ToggleGroupItem value={DrawMode.SELECT}>
              <MousePointer2 />
              Изабери
            </ToggleGroupItem>
            <ToggleGroupItem value={DrawMode.DRAW_CORRIDOR}>
              <RectangleEllipsis />
              Коридор
            </ToggleGroupItem>
            <ToggleGroupItem value={DrawMode.DRAW_OBSTACLE}>
              <OctagonMinus />
              Препрека
            </ToggleGroupItem>
          </ToggleGroup>
          {drawMode == DrawMode.DRAW_CORRIDOR && <Input
            className="mt-2"
            type="number"
            value={width}
            onChange={e => setWidth(+e.target.value)}
          />}
          {drawMode == DrawMode.SELECT && changed && <Button onClick={updateSelected}>Сачувај</Button>}
          {drawMode == DrawMode.SELECT && !!selected && <Button onClick={removeSelected}>Уклони</Button>}
        </CardContent>
      </Card>
    </>
  );
}

const customStyles: any[] = [
  {
    'id': 'draw-poly-fill',
    'type': 'fill',
    'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    'paint': { 'fill-color': '#ff4d4f', 'fill-opacity': 0.3 }
  },
  {
    'id': 'draw-poly-stroke',
    'type': 'line',
    'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    'paint': { 'line-color': '#ff4d4f', 'line-width': 2 }
  },
  {
    'id': 'draw-line',
    'type': 'line',
    'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': [
        'case',
        ['==', 'mode', 'direct_select'], '#8B0000', // Dark Red
        '#003366' // Default Blue
      ],
      'line-dasharray': [
        'case',
        ['==', ['get', 'active'], 'true'], ['literal', [1, 0]], // Solid when selected
        ['literal', [2, 2]] // Dashed when inactive
      ],
      'line-width': [
        'case',
        ['==', ['get', 'active'], 'true'], 4, 2
      ],
      'line-opacity': 0.9
    }
  },
  {
    'id': 'draw-vertex',
    'type': 'circle',
    'filter': [
      'all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['==', 'mode', 'direct_select'] // Only show handles in direct edit mode
    ],
    'paint': {
      'circle-radius': 6,
      'circle-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#003366'
    }
  }
];
