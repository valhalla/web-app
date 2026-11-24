import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getBaseUrl,
  setBaseUrl,
  getDefaultBaseUrl,
  getSavedBaseUrls,
  saveBaseUrl,
  removeSavedBaseUrl,
  validateBaseUrl,
  normalizeBaseUrl,
  testConnection,
} from '@/utils/base-url';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import {
  Server,
  RotateCcw,
  Loader2,
  ChevronDown,
  Check,
  Trash2,
} from 'lucide-react';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field';

export const ServerSettings = () => {
  const [baseUrl, setBaseUrlState] = useState<string>(() => getBaseUrl());
  const [savedUrls, setSavedUrls] = useState<string[]>(() =>
    getSavedBaseUrls()
  );
  const [isOpen, setIsOpen] = useState(false);

  const connectionMutation = useMutation({
    mutationFn: testConnection,
    onSuccess: (result, url) => {
      if (result.reachable) {
        const normalizedUrl = normalizeBaseUrl(url);
        setBaseUrl(normalizedUrl);
        saveBaseUrl(normalizedUrl);
        setBaseUrlState(normalizedUrl);
        setSavedUrls(getSavedBaseUrls());
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

  const handleSelectSavedUrl = (url: string) => {
    setBaseUrlState(url);
    connectionMutation.reset();

    if (url === getDefaultBaseUrl()) {
      setBaseUrl(url);
      return;
    }

    connectionMutation.mutate(url);
  };

  const handleRemoveSavedUrl = (url: string) => {
    const wasActive = url === getBaseUrl();
    removeSavedBaseUrl(url);
    setSavedUrls(getSavedBaseUrls());

    if (wasActive) {
      setBaseUrlState(getDefaultBaseUrl());
      connectionMutation.reset();
    }
  };

  const activeUrl = getBaseUrl();

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
            The Valhalla server URL for routing and isochrone requests. Working
            URLs are saved for quick switching.
          </FieldDescription>
          <InputGroup>
            <InputGroupInput
              id="base-url-input"
              type="url"
              placeholder="https://valhalla.example.com"
              value={baseUrl}
              onChange={handleBaseUrlChange}
              onBlur={handleBaseUrlBlur}
              disabled={connectionMutation.isPending}
              aria-invalid={!!errorMessage}
            />
            <InputGroupAddon align="inline-end">
              {connectionMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Saved servers"
                    disabled={connectionMutation.isPending}
                  >
                    <ChevronDown />
                  </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Saved servers</DropdownMenuLabel>
                  {savedUrls.map((url) => {
                    const isDefault = url === getDefaultBaseUrl();
                    return (
                      <DropdownMenuItem
                        key={url}
                        onSelect={() => handleSelectSavedUrl(url)}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' && !isDefault) {
                            handleRemoveSavedUrl(url);
                          }
                        }}
                      >
                        <Check
                          className={url === activeUrl ? '' : 'invisible'}
                        />
                        <span className="flex-1 truncate" title={url}>
                          {url}
                        </span>
                        {isDefault ? (
                          <span className="text-muted-foreground text-xs">
                            default
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Remove ${url}`}
                            onClick={(e) => {
                              // keep the menu open and don't select the row
                              e.stopPropagation();
                              handleRemoveSavedUrl(url);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </InputGroupAddon>
          </InputGroup>
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
