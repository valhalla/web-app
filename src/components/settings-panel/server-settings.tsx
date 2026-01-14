import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getBaseUrl,
  setBaseUrl,
  getDefaultBaseUrl,
  validateBaseUrl,
  normalizeBaseUrl,
  testConnection,
} from '@/utils/base-url';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Server, RotateCcw, Loader2 } from 'lucide-react';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field';

export const ServerSettings = () => {
  const [baseUrl, setBaseUrlState] = useState<string>(() => getBaseUrl());
  const [baseUrlError, setBaseUrlError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseUrlState(e.target.value);
    setBaseUrlError(null);
  };

  const handleBaseUrlBlur = async () => {
    const currentStoredUrl = getBaseUrl();
    const trimmedUrl = baseUrl.trim();

    if (trimmedUrl === currentStoredUrl) {
      return;
    }

    if (trimmedUrl === '' || trimmedUrl === getDefaultBaseUrl()) {
      setBaseUrl(trimmedUrl);
      setBaseUrlState(trimmedUrl || getDefaultBaseUrl());
      setBaseUrlError(null);
      return;
    }

    const validation = validateBaseUrl(trimmedUrl);
    if (!validation.valid) {
      setBaseUrlError(validation.error || 'Invalid URL');
      return;
    }

    setIsTestingConnection(true);
    setBaseUrlError(null);

    const result = await testConnection(trimmedUrl);

    setIsTestingConnection(false);

    if (result.reachable) {
      const normalizedUrl = normalizeBaseUrl(trimmedUrl);
      setBaseUrl(normalizedUrl);
      setBaseUrlState(normalizedUrl);
      setBaseUrlError(null);
    } else {
      setBaseUrlError(result.error || 'Server unreachable');
    }
  };

  const handleResetBaseUrl = () => {
    const defaultUrl = getDefaultBaseUrl();
    setBaseUrlState(defaultUrl);
    setBaseUrl(defaultUrl);
    setBaseUrlError(null);
  };

  return (
    <CollapsibleSection
      title="Server Settings"
      icon={Server}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="space-y-2">
        <Field data-invalid={!!baseUrlError}>
          <FieldLabel htmlFor="base-url-input">Base URL</FieldLabel>
          <FieldDescription>
            The Valhalla server URL for routing and isochrone requests
          </FieldDescription>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="base-url-input"
                type="url"
                placeholder="https://valhalla.example.com"
                value={baseUrl}
                onChange={handleBaseUrlChange}
                onBlur={handleBaseUrlBlur}
                disabled={isTestingConnection}
                aria-invalid={!!baseUrlError}
                className={
                  baseUrlError
                    ? 'border-destructive focus-visible:ring-destructive/50'
                    : ''
                }
              />
              {isTestingConnection && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          <FieldError>{baseUrlError}</FieldError>
        </Field>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetBaseUrl}
          disabled={
            isTestingConnection ||
            normalizeBaseUrl(baseUrl) === getDefaultBaseUrl()
          }
          className="w-full"
        >
          <RotateCcw className="size-3.5" />
          Reset Base URL
        </Button>
      </div>
    </CollapsibleSection>
  );
};
