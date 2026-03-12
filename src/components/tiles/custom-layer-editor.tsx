import { useState, useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { LayerSpecification } from 'maplibre-gl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { VALHALLA_SOURCE_ID } from './valhalla-layers';

const EXAMPLE_LAYER = JSON.stringify(
  {
    id: 'custom-dead-ends',
    type: 'line',
    source: 'valhalla-tiles',
    'source-layer': 'edges',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'dead_end'], true],
        '#ff0000',
        'transparent',
      ],
      'line-width': 3,
    },
  },
  null,
  2
);

interface CustomLayerEditorProps {
  customLayers: { layer: LayerSpecification; visible: boolean }[];
  onLayerAdded: (layer: LayerSpecification) => void;
}

export const CustomLayerEditor = ({
  customLayers,
  onLayerAdded,
}: CustomLayerEditorProps) => {
  const { mainMap } = useMap();
  const [open, setOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [valhallaEnabled, setValhallaEnabled] = useState(false);

  useEffect(() => {
    if (!mainMap) return;

    const map = mainMap.getMap();

    const handleStyleData = () => {
      setValhallaEnabled(!!map.getSource(VALHALLA_SOURCE_ID));
    };

    map.on('styledata', handleStyleData);

    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [mainMap]);

  const handleSubmit = () => {
    if (!mainMap) return;
    const map = mainMap.getMap();

    let parsed: LayerSpecification;
    try {
      parsed = JSON.parse(jsonValue) as LayerSpecification;
    } catch {
      setError('Invalid JSON. Please check your input.');
      return;
    }

    if (!parsed.id || typeof parsed.id !== 'string') {
      setError('Layer must have a string "id" field.');
      return;
    }

    if (map.getLayer(parsed.id)) {
      setError(`Layer with id "${parsed.id}" already exists on the map.`);
      return;
    }

    if (customLayers.some((e) => e.layer.id === parsed.id)) {
      setError(`A custom layer with id "${parsed.id}" is already tracked.`);
      return;
    }

    try {
      map.addLayer(parsed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add layer to map.'
      );
      return;
    }

    onLayerAdded(parsed);
    setJsonValue('');
    setError(null);
    setOpen(false);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          disabled={!valhallaEnabled}
        >
          <Plus className="size-4" />
          Add Custom Layer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Custom Layer</DialogTitle>
          <DialogDescription>
            Paste a{' '}
            <a
              href="https://maplibre.org/maplibre-style-spec/layers/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              MapLibre layer definition
            </a>{' '}
            as JSON. Use{' '}
            <code className="text-xs bg-muted px-1 rounded">
              valhalla-tiles
            </code>{' '}
            as the source to visualize Valhalla tile attributes.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          className="font-mono text-xs min-h-40 flex-1 resize-none overflow-y-auto"
          placeholder={EXAMPLE_LAYER}
          value={jsonValue}
          onChange={(e) => {
            setJsonValue(e.target.value);
            setError(null);
          }}
          spellCheck={false}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!jsonValue.trim()}>
            Add Layer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
