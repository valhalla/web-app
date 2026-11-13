import { Waypoints } from './waypoints';
import { SettingsFooter } from '@/components/settings-footer';
import { QuickSettings } from '@/components/quick-settings';
import { useIsochronesStore } from '@/stores/isochrones-store';
import { IsochroneCard } from './isochrone-card';

export const IsochronesControl = () => {
  const results = useIsochronesStore((state) => state.results);
  return (
    <>
      <Waypoints />
      <QuickSettings showAlternates={false} showLanguage={false} />
      <SettingsFooter />
      {results.data && (
        <div>
          <h3 className="font-bold mb-2">Isochrones</h3>
          <IsochroneCard data={results.data} showOnMap={results.show} />
        </div>
      )}
    </>
  );
};
