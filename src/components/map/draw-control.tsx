import { useRef, useMemo } from 'react';
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
  const finishHandlerRef = useRef<((id: string | number) => void) | null>(null);
  const changeHandlerRef = useRef<
    ((ids: (string | number)[], type: string) => void) | null
  >(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedOnUpdate = useMemo(() => {
    if (!onUpdate) return undefined;
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        onUpdate();
        debounceTimeoutRef.current = null;
      }, 50);
    };
  }, [onUpdate]);

  useControl<MaplibreTerradrawControl>(
    () => {
      const control = new MaplibreTerradrawControl({
        modes: ['polygon', 'select', 'delete-selection'],
        open: true,
      });

      if (controlRef) {
        controlRef.current = control;
      }

      return control;
    },
    () => {
      if (controlRef?.current && debouncedOnUpdate) {
        const terraDrawInstance = controlRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          finishHandlerRef.current = (id: string | number) => {
            const feature = terraDrawInstance.getSnapshotFeature(id);
            if (feature?.properties?.mode === 'polygon') {
              debouncedOnUpdate();
            }
          };
          terraDrawInstance.on('finish', finishHandlerRef.current);

          changeHandlerRef.current = (
            _ids: (string | number)[],
            type: string
          ) => {
            if (type === 'delete') {
              debouncedOnUpdate();
            }
          };
          terraDrawInstance.on('change', changeHandlerRef.current);
        }
      }
    },
    () => {
      if (controlRef?.current) {
        const terraDrawInstance = controlRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          if (finishHandlerRef.current) {
            terraDrawInstance.off('finish', finishHandlerRef.current);
          }
          if (changeHandlerRef.current) {
            terraDrawInstance.off('change', changeHandlerRef.current);
          }
        }
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    },
    {
      position: position,
    }
  );

  return null;
}
