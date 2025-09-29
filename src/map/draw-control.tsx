import { useControl } from 'react-map-gl/maplibre';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import type { TerraDraw, TerraDrawEventListeners } from 'terra-draw';
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css';

type DrawControlProps = {
  onFinish?: () => void;
  onModeChanged?: (mode: string) => void;
  setTerraDraw?: (td: TerraDraw) => void;
};

export function DrawControl({
  onFinish,
  onModeChanged,
  setTerraDraw,
}: DrawControlProps) {
  // keep a stable handler reference for add/remove
  const finishHandler: TerraDrawEventListeners['finish'] = () => {
    if (onFinish) onFinish();
  };

  const ctrl = useControl(
    () =>
      new MaplibreTerradrawControl({
        modes: ['polygon', 'select', 'delete-selection'],
        open: true,
      }),
    () => {
      const td = ctrl.getTerraDrawInstance();
      if (setTerraDraw) setTerraDraw(td);
      if (onFinish) td.on('finish', finishHandler);
      if (onModeChanged) {
        ctrl.on('mode-changed', ({ mode }) => onModeChanged(mode));
      }
    },
    () => {
      try {
        const td = ctrl.getTerraDrawInstance();
        if (onFinish) td.off('finish', finishHandler);
        if (onModeChanged) ctrl.off('mode-changed', () => {});
      } catch {
        // ignore if instance not available
      }
    }
  );

  return null;
}
