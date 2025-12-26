import { useRef, useState } from 'react';
import { z } from 'zod';
import type maplibregl from 'maplibre-gl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../ui/field';
import { FolderIcon, LoaderIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { CUSTOM_STYLE_STORAGE_KEY, MAP_STYLE_STORAGE_KEY } from './constants';

const styleUrlSchema = z.string().url('Please enter a valid URL');

const mapStyleSchema = z.object({
  version: z.number(),
  name: z.string().optional(),
  sources: z.record(z.unknown()),
  layers: z.array(z.unknown()),
});

interface CustomStylesDialogProps {
  onStyleLoaded?: (styleData: maplibregl.StyleSpecification) => void;
}

export const CustomStylesDialog = ({
  onStyleLoaded,
}: CustomStylesDialogProps) => {
  const [styleUrl, setStyleUrl] = useState('');
  const [styleUrlError, setStyleUrlError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveStyleAndNotify = (styleJson: maplibregl.StyleSpecification) => {
    localStorage.setItem(CUSTOM_STYLE_STORAGE_KEY, JSON.stringify(styleJson));
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, 'custom');
    onStyleLoaded?.(styleJson);
    setDialogOpen(false);
    setStyleUrl('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = mapStyleSchema.safeParse(json);

      if (!result.success) {
        setStyleUrlError('Invalid MapLibre style.json format');
        return;
      }

      saveStyleAndNotify(json as maplibregl.StyleSpecification);
    } catch {
      setStyleUrlError('Failed to parse JSON file');
    }
  };

  const handleLoadUrl = async () => {
    const urlResult = styleUrlSchema.safeParse(styleUrl);
    if (!urlResult.success) {
      setStyleUrlError(
        urlResult.error.errors[0]?.message ?? 'Please enter a valid URL'
      );
      return;
    }

    setIsLoading(true);
    setStyleUrlError(null);

    try {
      const response = await fetch(styleUrl, {
        mode: 'cors',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const result = mapStyleSchema.safeParse(json);

      if (!result.success) {
        setStyleUrlError('Invalid MapLibre style.json format');
        return;
      }

      saveStyleAndNotify(json as maplibregl.StyleSpecification);
    } catch (error) {
      setStyleUrlError(
        error instanceof Error ? error.message : 'Failed to fetch style'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          Load custom styles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Custom styles</DialogTitle>
          <DialogDescription>
            With this option, you can load custom styles from a URL or a local
            file.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field className="gap-2" data-invalid={!!styleUrlError}>
            <FieldLabel htmlFor="style-url">Load from URL</FieldLabel>
            <FieldDescription>
              URL must have{' '}
              <a
                href="https://enable-cors.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                CORS enabled
              </a>
              .
            </FieldDescription>
            <Input
              type="url"
              id="style-url"
              placeholder="https://example.com/style.json"
              value={styleUrl}
              onChange={(e) => {
                setStyleUrl(e.target.value);
                setStyleUrlError(null);
              }}
              aria-invalid={!!styleUrlError}
            />
            {styleUrlError && <FieldError>{styleUrlError}</FieldError>}
            <Button
              variant="outline"
              onClick={handleLoadUrl}
              disabled={isLoading}
            >
              {isLoading && <LoaderIcon className="size-4 animate-spin" />}
              Load
            </Button>
          </Field>
          <Field className="gap-2">
            <FieldLabel htmlFor="style-file">Load from local file</FieldLabel>
            <input
              ref={fileInputRef}
              id="style-file"
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderIcon className="size-4" />
              Choose file
            </Button>
          </Field>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
};
