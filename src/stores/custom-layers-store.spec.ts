import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomLayersStore } from './custom-layers-store';
import type { LayerSpecification } from 'maplibre-gl';

const mockLineLayer: LayerSpecification = {
  id: 'test-layer',
  type: 'line',
  source: 'valhalla-tiles',
  'source-layer': 'edges',
  paint: { 'line-color': '#ff0000' },
};

const mockLineLayer2: LayerSpecification = {
  id: 'test-layer-2',
  type: 'line',
  source: 'valhalla-tiles',
  'source-layer': 'edges',
  paint: { 'line-color': '#00ff00' },
};

describe('useCustomLayersStore', () => {
  beforeEach(() => {
    useCustomLayersStore.setState({ layers: [] });
  });

  describe('initial state', () => {
    it('should initialize with an empty layers array', () => {
      const { layers } = useCustomLayersStore.getState();
      expect(layers).toEqual([]);
    });
  });

  describe('addLayer', () => {
    it('should add a layer with visible: true by default', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);

      const { layers } = useCustomLayersStore.getState();
      expect(layers).toHaveLength(1);
      expect(layers[0]).toEqual({ layer: mockLineLayer, visible: true });
    });

    it('should add multiple layers', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().addLayer(mockLineLayer2);

      const { layers } = useCustomLayersStore.getState();
      expect(layers).toHaveLength(2);
    });

    it('should preserve insertion order', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().addLayer(mockLineLayer2);

      const { layers } = useCustomLayersStore.getState();
      expect(layers[0]!.layer.id).toBe('test-layer');
      expect(layers[1]!.layer.id).toBe('test-layer-2');
    });

    it('should not add a layer if its id is already tracked', () => {
      const layer = { id: 'dupe-layer', type: 'line' } as LayerSpecification;
      useCustomLayersStore.getState().addLayer(layer);
      useCustomLayersStore.getState().addLayer(layer);
      expect(useCustomLayersStore.getState().layers).toHaveLength(1);
    });
  });

  describe('removeLayer', () => {
    it('should remove a layer by id', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().removeLayer('test-layer');

      const { layers } = useCustomLayersStore.getState();
      expect(layers).toHaveLength(0);
    });

    it('should not remove other layers when removing by id', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().addLayer(mockLineLayer2);
      useCustomLayersStore.getState().removeLayer('test-layer');

      const { layers } = useCustomLayersStore.getState();
      expect(layers).toHaveLength(1);
      expect(layers[0]!.layer.id).toBe('test-layer-2');
    });

    it('should be a no-op when layer id does not exist', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().removeLayer('nonexistent');

      const { layers } = useCustomLayersStore.getState();
      expect(layers).toHaveLength(1);
    });
  });

  describe('setLayerVisibility', () => {
    it('should set layer visibility to false', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().setLayerVisibility('test-layer', false);

      const { layers } = useCustomLayersStore.getState();
      expect(layers[0]!.visible).toBe(false);
    });

    it('should set layer visibility back to true', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().setLayerVisibility('test-layer', false);
      useCustomLayersStore.getState().setLayerVisibility('test-layer', true);

      const { layers } = useCustomLayersStore.getState();
      expect(layers[0]!.visible).toBe(true);
    });

    it('should not affect other layers when changing one layer visibility', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().addLayer(mockLineLayer2);
      useCustomLayersStore.getState().setLayerVisibility('test-layer', false);

      const { layers } = useCustomLayersStore.getState();
      expect(layers[0]!.visible).toBe(false);
      expect(layers[1]!.visible).toBe(true);
    });

    it('should be a no-op when layer id does not exist', () => {
      useCustomLayersStore.getState().addLayer(mockLineLayer);
      useCustomLayersStore.getState().setLayerVisibility('nonexistent', false);

      const { layers } = useCustomLayersStore.getState();
      expect(layers[0]!.visible).toBe(true);
    });
  });
});
