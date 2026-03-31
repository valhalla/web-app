import type { LayerSpecification } from 'maplibre-gl';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_LAYERS,
  getValhallaSourceSpec,
} from './valhalla-layers';
import { SourceLayersToggle } from './source-layers-toggle';

interface ValhallaLayersToggleProps {
  customLayers: { layer: LayerSpecification; visible: boolean }[];
}

export const ValhallaLayersToggle = ({
  customLayers,
}: ValhallaLayersToggleProps) => {
  return (
    <SourceLayersToggle
      label="Append Valhalla layers"
      sourceId={VALHALLA_SOURCE_ID}
      layers={VALHALLA_LAYERS}
      customLayers={customLayers}
      buildSourceSpec={getValhallaSourceSpec}
    />
  );
};
