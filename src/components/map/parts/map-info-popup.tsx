import { Button } from '@/components/ui/button';
import { CoordinateRow } from '@/components/ui/coordinate-row';
import {
  X,
  Locate,
  Globe,
  Compass,
  Cog,
  MapPin,
  ArrowUpDown,
} from 'lucide-react';
import { convertDDToDMS } from '../utils';

interface MapInfoPopupProps {
  popupLngLat: { lng: number; lat: number };
  elevation: string;
  isHeightLoading: boolean;
  isLocateLoading: boolean;
  locate: unknown[];
  onLocate: (lng: number, lat: number) => void;
  onClose: () => void;
}

export function MapInfoPopup({
  popupLngLat,
  elevation,
  isHeightLoading,
  isLocateLoading,
  locate,
  onLocate,
  onClose,
}: MapInfoPopupProps) {
  const lngLatStr = `${popupLngLat.lng.toFixed(6)}, ${popupLngLat.lat.toFixed(6)}`;
  const latLngStr = `${popupLngLat.lat.toFixed(6)}, ${popupLngLat.lng.toFixed(6)}`;
  const dmsStr = `${convertDDToDMS(popupLngLat.lat)} N ${convertDDToDMS(popupLngLat.lng)} E`;
  const valhallaJson = JSON.stringify(
    {
      lon: Number(popupLngLat.lng.toFixed(6)),
      lat: Number(popupLngLat.lat.toFixed(6)),
    },
    null,
    2
  );

  return (
    <div className="flex flex-col gap-2 p-2">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClose}
        className="absolute right-1 top-1"
      >
        <X className="size-4" />
      </Button>

      <CoordinateRow
        label="Longitude, Latitude"
        value={lngLatStr}
        copyText={lngLatStr.replace(' ', '')}
        icon={<Locate className="size-3.5" />}
        testId="dd"
      />

      <CoordinateRow
        label="Latitude, Longitude"
        value={latLngStr}
        copyText={latLngStr.replace(' ', '')}
        icon={<Globe className="size-3.5" />}
        testId="latlng"
      />

      <CoordinateRow
        label="Latitude, Longitude (DMS)"
        value={dmsStr}
        copyText={dmsStr}
        icon={<Compass className="size-3.5" />}
        testId="dms"
      />

      <CoordinateRow
        label="Calls Valhalla's Locate API"
        value="Locate Point"
        copyText={JSON.stringify(locate)}
        icon={<Cog className="size-3.5" />}
        onClick={() => onLocate(popupLngLat.lng, popupLngLat.lat)}
        isLoading={isLocateLoading}
        copyDisabled={locate.length === 0}
        testId="locate-point"
      />

      <CoordinateRow
        label="Copies a Valhalla location object to clipboard for API requests"
        value="Valhalla Location JSON"
        copyText={valhallaJson}
        icon={<MapPin className="size-3.5" />}
        testId="location-json"
      />

      <CoordinateRow
        label="Elevation at this point"
        value={elevation}
        icon={<ArrowUpDown className="size-3.5" />}
        isLoading={isHeightLoading}
        testId="elevation"
      />
    </div>
  );
}
