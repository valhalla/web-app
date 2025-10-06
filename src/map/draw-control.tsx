import React from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

interface DrawControlProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onUpdate?: () => void;
  controlRef?: React.MutableRefObject<MaplibreTerradrawControl | null>;
}

export function DrawControl(props: DrawControlProps) {
  useControl<MaplibreTerradrawControl>(
    // onCreate
    () => {
      const control = new MaplibreTerradrawControl({
        modes: ['polygon', 'select', 'delete'],
        open: true,
      });

      // Store reference
      if (props.controlRef) {
        props.controlRef.current = control;
      }

      return control;
    },
    // onAdd
    () => {
      if (props.controlRef?.current && props.onUpdate) {
        const terraDrawInstance =
          props.controlRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          terraDrawInstance.on('finish', props.onUpdate);
        }
      }
    },
    // onRemove
    () => {
      if (props.controlRef?.current && props.onUpdate) {
        const terraDrawInstance =
          props.controlRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          terraDrawInstance.off('finish', props.onUpdate);
        }
      }
    },
    {
      position: props.position || 'top-right',
    }
  );

  return null;
}
