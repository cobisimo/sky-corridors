import { useMemo } from "react";
import { useControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import MapboxDraw from "@mapbox/mapbox-gl-draw";

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

export default DrawControl;
