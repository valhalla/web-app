import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DirectionsControl } from './directions/directions';
import { IsochronesControl } from './isochrones/isochrones';
import { useCommonStore } from '@/stores/common-store';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ProfilePicker } from './profile-picker';
import { SettingsButton } from './settings-button';
import type { Profile } from '@/stores/common-store';
import { useDirectionsStore } from '@/stores/directions-store';
import { useIsochronesStore } from '@/stores/isochrones-store';

export const RoutePlanner = () => {
  const { activeTab } = useParams({ from: '/$activeTab' });
  const navigate = useNavigate({ from: '/$activeTab' });
  const directionsPanelOpen = useCommonStore(
    (state) => state.directionsPanelOpen
  );
  const makeRequest = useDirectionsStore((state) => state.makeRequest);
  const makeIsochronesRequest = useIsochronesStore(
    (state) => state.makeIsochronesRequest
  );
  const loading = useCommonStore((state) => state.loading);
  const toggleDirections = useCommonStore((state) => state.toggleDirections);

  const {
    data: lastUpdate,
    isLoading: isLoadingLastUpdate,
    isError: isErrorLastUpdate,
  } = useQuery({
    queryKey: ['lastUpdate'],
    queryFn: async () => {
      const response = await fetch(`${VALHALLA_OSM_URL}/status`);
      const data = await response.json();
      return new Date(data.tileset_last_modified * 1000);
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const handleTabChange = (value: string) => {
    navigate({ params: { activeTab: value } });
  };

  const handleProfileChange = (value: Profile) => {
    navigate({
      search: (prev) => ({ ...prev, profile: value }),
      replace: true,
    });

    if (activeTab === 'isochrones') {
      makeIsochronesRequest();
      setTimeout(() => {
        makeRequest();
      }, 1000);
    } else {
      makeRequest();
      setTimeout(() => {
        makeIsochronesRequest();
      }, 1000);
    }
  };

  return (
    <Sheet open={directionsPanelOpen} modal={false}>
      <SheetTrigger className="absolute top-4 left-4 z-10" asChild>
        <Button onClick={toggleDirections} data-testid="open-directions-button">
          {activeTab === 'directions' ? 'Directions' : 'Isochrones'}
        </Button>
      </SheetTrigger>
      <Tabs
        value={activeTab}
        className="w-[400px]"
        onValueChange={handleTabChange}
      >
        <SheetContent
          side="left"
          className="w-[400px] sm:max-w-[unset] max-h-screen overflow-y-auto gap-1"
        >
          <SheetHeader className="justify-between">
            <TabsList>
              <TabsTrigger
                value="directions"
                data-testid="directions-tab-button"
              >
                Directions
              </TabsTrigger>
              <TabsTrigger
                value="isochrones"
                data-testid="isochrones-tab-button"
              >
                Isochrones
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDirections}
              data-testid="close-directions-button"
            >
              <X className="size-4" />
            </Button>
            <SheetTitle className="sr-only">
              {activeTab === 'directions' ? 'Directions' : 'Isochrones'}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {activeTab === 'directions'
                ? 'Plan a route between multiple locations'
                : 'Calculate reachable areas from a location'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex justify-between px-2 mb-1">
            <ProfilePicker
              loading={loading}
              onProfileChange={handleProfileChange}
            />
            <SettingsButton />
          </div>

          <TabsContent value="directions" className="flex flex-col gap-3 px-2">
            <DirectionsControl />
          </TabsContent>
          <TabsContent value="isochrones" className="flex flex-col gap-3 px-2">
            <IsochronesControl />
          </TabsContent>

          <div className="flex p-2 text-sm">
            {isLoadingLastUpdate && (
              <span className="text-muted-foreground">
                Loading last update...
              </span>
            )}
            {isErrorLastUpdate && (
              <span className="text-destructive">
                Failed to load last update
              </span>
            )}
            {lastUpdate && (
              <span>
                Last Data Update: {format(lastUpdate, 'yyyy-MM-dd, HH:mm')}
              </span>
            )}
          </div>
        </SheetContent>
      </Tabs>
    </Sheet>
  );
};
