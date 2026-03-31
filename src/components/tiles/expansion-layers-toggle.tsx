import type { LayerSpecification } from 'maplibre-gl';
import { SourceLayersToggle } from './source-layers-toggle';
import {
  EXPANSION_LAYERS,
  EXPANSION_SOURCE_ID,
  getExpansionSourceSpec,
} from './expansion-layers';

interface ExpansionLayersToggleProps {
  customLayers: { layer: LayerSpecification; visible: boolean }[];
}

export const ExpansionLayersToggle = ({
  customLayers,
}: ExpansionLayersToggleProps) => {
  return (
    <SourceLayersToggle
      label="Append Expansion layers"
      sourceId={EXPANSION_SOURCE_ID}
      layers={EXPANSION_LAYERS}
      customLayers={customLayers}
      buildSourceSpec={getExpansionSourceSpec}
    />
  );
};
