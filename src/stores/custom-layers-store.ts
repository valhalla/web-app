import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LayerSpecification } from 'maplibre-gl';

export interface CustomLayerEntry {
  layer: LayerSpecification;
  visible: boolean;
}

interface CustomLayersState {
  layers: CustomLayerEntry[];
}

interface CustomLayersActions {
  addLayer: (layer: LayerSpecification) => void;
  removeLayer: (id: string) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
}

type CustomLayersStore = CustomLayersState & CustomLayersActions;

export const useCustomLayersStore = create<CustomLayersStore>()(
  devtools(
    immer((set) => ({
      layers: [],

      addLayer: (layer) =>
        set(
          (draft: unknown) => {
            const state = draft as CustomLayersState;
            if (!state.layers.some((e) => e.layer.id === layer.id)) {
              state.layers.push({
                layer,
                visible: true,
              });
            }
          },
          undefined,
          'addLayer'
        ),

      removeLayer: (id) =>
        set(
          (draft: unknown) => {
            const state = draft as CustomLayersState;
            state.layers = state.layers.filter(
              (entry) => entry.layer.id !== id
            );
          },
          undefined,
          'removeLayer'
        ),

      setLayerVisibility: (id, visible) =>
        set(
          (draft: unknown) => {
            const state = draft as CustomLayersState;
            const entry = state.layers.find((e) => e.layer.id === id);
            if (entry) entry.visible = visible;
          },
          undefined,
          'setLayerVisibility'
        ),
    })),
    { name: 'custom-layers' }
  )
);
