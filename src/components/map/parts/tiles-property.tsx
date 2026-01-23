import type { ReactNode } from 'react';
import { ExternalLink, Check, X as XIcon } from 'lucide-react';

import { propertyNameMappings } from './tiles-constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TilesPropertyProps {
  propertyKey: string;
  value: unknown;
}

export function TilesProperty({
  propertyKey,
  value,
}: TilesPropertyProps): ReactNode {
  // OSM ID - link to OpenStreetMap
  if (
    (propertyKey === 'osm_id' || propertyKey === 'osm_way_id') &&
    (typeof value === 'number' || typeof value === 'string')
  ) {
    const osmUrl = `https://www.openstreetmap.org/way/${value}`;
    return (
      <a
        href={osmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline gap-1 font-mono"
      >
        <ExternalLink className="size-3 inline ml-1" />
        {String(value)}
      </a>
    );
  }

  const mapping = propertyNameMappings[propertyKey];
  if (mapping && typeof value === 'number') {
    const name = mapping[value] || 'Unknown';
    return (
      <span className="inline-flex items-center gap-1.5">
        <Badge variant="outline">{name}</Badge>
        <span>({value})</span>
      </span>
    );
  }

  if (propertyKey.startsWith('access:')) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center size-5 rounded-full',
          value
            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/20 text-red-600 dark:text-red-400'
        )}
      >
        {value ? <Check className="size-3" /> : <XIcon className="size-3" />}
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1',
          value
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        )}
      >
        {value ? (
          <Check className="size-3.5" />
        ) : (
          <XIcon className="size-3.5" />
        )}
        <span className="text-xs">{value ? 'Yes' : 'No'}</span>
      </span>
    );
  }

  if (propertyKey === 'length') {
    return (
      <span className="font-mono text-xs">
        {String(value)}
        <span className="text-muted-foreground ml-0.5">m</span>
      </span>
    );
  }

  if (propertyKey.includes('speed')) {
    return (
      <span className="font-mono text-xs">
        {String(value)}
        <span className="text-muted-foreground ml-0.5">km/h</span>
      </span>
    );
  }

  if (propertyKey.includes('slope')) {
    return (
      <span className="font-mono text-xs">
        {String(value)}
        <span className="text-muted-foreground">°</span>
      </span>
    );
  }

  if (typeof value === 'object') {
    return (
      <code className="text-[10px] font-mono text-muted-foreground">
        {JSON.stringify(value)}
      </code>
    );
  }

  return <span className="font-mono text-xs">{String(value)}</span>;
}
