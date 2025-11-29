import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DirectionsControl } from './directions';
import { IsochronesControl } from './isochrones';
import {
  updateTab,
  updateProfile,
  updatePermalink,
  toggleDirections,
} from '@/actions/common-actions';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
import type { AppDispatch, RootState } from '@/store';
import type { Profile } from '@/reducers/common';
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
import type { PossibleTabValues } from '@/components/types';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidProfile } from './utils';

export const RoutePlanner = () => {
  const { activeTab, showDirectionsPanel, profile } = useSelector(
    (state: RootState) => state.common
  );
  const dispatch = useDispatch<AppDispatch>();
  const initialUrlParams = useRef(parseUrlParams());

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

  useEffect(() => {
    const profileParam = initialUrlParams.current.profile;

    if (profileParam === profile) {
      return;
    }

    if (profileParam && isValidProfile(profileParam)) {
      dispatch(updateProfile({ profile: profileParam }));
    } else {
      const defaultProfile: Profile = 'bicycle';
      dispatch(updateProfile({ profile: defaultProfile }));

      const url = new URL(window.location.href);
      url.searchParams.set('profile', defaultProfile);
      window.history.replaceState({}, '', url.toString());
    }
  }, [dispatch, profile]);

  useEffect(() => {
    const pathname = window.location.pathname;

    if (pathname.includes(activeTab)) {
      return;
    }

    if (pathname === '/directions') {
      dispatch(updateTab({ activeTab: 'directions' }));
    } else if (pathname === '/isochrones') {
      dispatch(updateTab({ activeTab: 'isochrones' }));
    }
  }, [dispatch, activeTab]);

  const handleTabChange = (value: PossibleTabValues) => {
    dispatch(updateTab({ activeTab: value }));
    dispatch(updatePermalink());
  };

  const handleDirectionsToggle = () => {
    dispatch(toggleDirections());
  };

  return (
    <Sheet open={showDirectionsPanel} modal={false}>
      <SheetTrigger className="absolute top-4 left-4 z-10" asChild>
        <Button
          onClick={handleDirectionsToggle}
          data-testid="open-directions-button"
        >
          {activeTab === 'directions' ? 'Directions' : 'Isochrones'}
        </Button>
      </SheetTrigger>
      <Tabs
        value={activeTab}
        className="w-[400px]"
        onValueChange={(value) => handleTabChange(value as PossibleTabValues)}
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
              onClick={handleDirectionsToggle}
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
