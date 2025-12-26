import { useState } from 'react';
import { z } from 'zod';
import type maplibregl from 'maplibre-gl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field';
import { Textarea } from '../ui/textarea';
import { CUSTOM_STYLE_STORAGE_KEY, MAP_STYLE_STORAGE_KEY } from './constants';

const mapStyleSchema = z.object({
  version: z.number(),
  name: z.string().optional(),
  sources: z.record(z.unknown()),
  layers: z.array(z.unknown()),
});

interface EditStylesDialogProps {
  styleData: maplibregl.StyleSpecification;
  onStyleSaved?: (styleData: maplibregl.StyleSpecification) => void;
}

export const EditStylesDialog = ({
  styleData,
  onStyleSaved,
}: EditStylesDialogProps) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      setJsonText(JSON.stringify(styleData, null, 2));
      setError(null);
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const result = mapStyleSchema.safeParse(parsed);

      if (!result.success) {
        setError('Invalid MapLibre style.json format');
        return;
      }

      const validStyle = parsed as maplibregl.StyleSpecification;

      localStorage.setItem(
        CUSTOM_STYLE_STORAGE_KEY,
        JSON.stringify(validStyle)
      );
      localStorage.setItem(MAP_STYLE_STORAGE_KEY, 'custom');

      onStyleSaved?.(validStyle);
      setDialogOpen(false);
    } catch {
      setError('Invalid JSON syntax');
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="destructive-outline">
          Edit custom style
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit custom style</DialogTitle>
          <DialogDescription>
            Edit the MapLibre style JSON directly. Changes will be applied when
            you save.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="flex-1 min-h-0">
          <Field className="flex-1 min-h-0" data-invalid={!!error}>
            <FieldLabel htmlFor="style-json">Style JSON</FieldLabel>
            <Textarea
              id="style-json"
              className="flex-1 min-h-[300px] max-h-[50vh] font-mono text-sm resize-none"
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError(null);
              }}
              aria-invalid={!!error}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
