import React from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css';

interface DrawControlProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onUpdate?: () => void;
  controlRef?: React.MutableRefObject<MaplibreTerradrawControl | null>;
}

export function DrawControl({
  position = 'top-right',
  onUpdate,
  controlRef,
}: DrawControlProps) {
  useControl<MaplibreTerradrawControl>(
    // onCreate
    () => {
      const control = new MaplibreTerradrawControl({
        modes: ['polygon', 'select', 'delete-selection'],
        open: true,
      });

      // Store reference
      if (controlRef) {
        controlRef.current = control;
      }

      return control;
    },
    // onAdd
    () => {
      if (controlRef?.current && onUpdate) {
        const terraDrawInstance = controlRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          terraDrawInstance.on('finish', onUpdate);
        }
      }
    },
    // onRemove
    () => {
      if (controlRef?.current && onUpdate) {
        const terraDrawInstance = controlRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          terraDrawInstance.off('finish', onUpdate);
        }
      }
    },
    {
      position: position,
    }
  );

  return null;
}
