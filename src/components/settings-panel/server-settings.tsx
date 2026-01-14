import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  const [isOpen, setIsOpen] = useState(false);

  const connectionMutation = useMutation({
    mutationFn: testConnection,
    onSuccess: (result, url) => {
      if (result.reachable) {
        const normalizedUrl = normalizeBaseUrl(url);
        setBaseUrl(normalizedUrl);
        setBaseUrlState(normalizedUrl);
      }
    },
  });

  const getErrorMessage = (): string | null => {
    if (connectionMutation.error) {
      return connectionMutation.error.message || 'Connection failed';
    }
    if (connectionMutation.data && !connectionMutation.data.reachable) {
      return connectionMutation.data.error || 'Server unreachable';
    }
    return null;
  };

  const errorMessage = getErrorMessage();

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseUrlState(e.target.value);
    connectionMutation.reset();
  };

  const handleBaseUrlBlur = () => {
    const currentStoredUrl = getBaseUrl();
    const trimmedUrl = baseUrl.trim();

    if (trimmedUrl === currentStoredUrl) {
      return;
    }

    const lastTestedUrl = connectionMutation.variables;
    if (lastTestedUrl === trimmedUrl && errorMessage) {
      return;
    }

    if (trimmedUrl === '' || trimmedUrl === getDefaultBaseUrl()) {
      setBaseUrl(trimmedUrl);
      setBaseUrlState(trimmedUrl || getDefaultBaseUrl());
      connectionMutation.reset();
      return;
    }

    const validation = validateBaseUrl(trimmedUrl);
    if (!validation.valid) {
      connectionMutation.mutate(trimmedUrl);
      return;
    }

    connectionMutation.mutate(trimmedUrl);
  };

  const handleResetBaseUrl = () => {
    const defaultUrl = getDefaultBaseUrl();
    setBaseUrlState(defaultUrl);
    setBaseUrl(defaultUrl);
    connectionMutation.reset();
  };

  return (
    <CollapsibleSection
      title="Server Settings"
      icon={Server}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="space-y-2">
        <Field data-invalid={!!errorMessage}>
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
                disabled={connectionMutation.isPending}
                aria-invalid={!!errorMessage}
                className={
                  errorMessage
                    ? 'border-destructive focus-visible:ring-destructive/50'
                    : ''
                }
              />
              {connectionMutation.isPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          <FieldError>{errorMessage}</FieldError>
        </Field>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetBaseUrl}
          disabled={
            connectionMutation.isPending ||
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
