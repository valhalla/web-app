import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import { toast } from 'react-toastify';
import DirectionsControl from './directions';
import IsochronesControl from './isochrones';
import DirectionOutputControl from './directions/output-control';
import IsochronesOutputControl from './isochrones/output-control';
import {
  Segment,
  Tab,
  Button,
  Icon,
  type ButtonProps,
} from 'semantic-ui-react';
import {
  updateTab,
  updateProfile,
  updatePermalink,
  zoomTo,
  resetSettings,
  toggleDirections,
} from '@/actions/common-actions';
import { fetchReverseGeocodePerma } from '@/actions/directions-actions';
import {
  fetchReverseGeocodeIso,
  updateIsoSettings,
} from '@/actions/isochrones-actions';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
import type { RootState } from '@/store';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { Message, Profile } from '@/reducers/common';

const pairwise = (
  arr: number[],
  func: (current: number, next: number, index: number) => void
) => {
  let cnt = 0;
  for (let i = 0; i < arr.length - 1; i += 2) {
    func(arr[i]!, arr[i + 1]!, cnt);
    cnt += 1;
  }
};

interface MainControlProps {
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  message: Message;
  activeTab: number;
  showDirectionsPanel: boolean;
}

const MainControl = (props: MainControlProps) => {
  const { activeTab } = props;
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const prevMessageRef = React.useRef<number | null>(null);

  const getLastUpdate = async () => {
    const response = await fetch(`${VALHALLA_OSM_URL}/status`);
    const data = await response.json();
    setLastUpdate(new Date(data.tileset_last_modified * 1000));
  };

  useEffect(() => {
    const { dispatch } = props;

    getLastUpdate();

    toast.success(
      'Welcome to Valhalla! Global Routing Service - funded by FOSSGIS e.V.',
      {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      }
    );

    const params = Object.fromEntries(
      new URL(document.location.href).searchParams
    );

    if ('profile' in params) {
      dispatch(updateProfile({ profile: params.profile as Profile }));
    }

    if (
      window.location.pathname === '/' ||
      window.location.pathname === '/directions'
    ) {
      dispatch(updateTab({ activeTab: 0 }));
    } else if (window.location.pathname === '/isochrones') {
      dispatch(updateTab({ activeTab: 1 }));
    }

    if ('wps' in params && params.wps.length > 0) {
      const coordinates = params.wps.split(',').map(Number);
      const processedCoords: number[][] = [];
      pairwise(coordinates, (current, next, i) => {
        const latLng = { lat: next, lng: current };
        const payload = {
          latLng,
          fromPerma: true,
          permaLast: i === coordinates.length / 2 - 1,
          index: i,
        };
        processedCoords.push([latLng.lat, latLng.lng]);
        if (activeTab === 0) {
          dispatch(fetchReverseGeocodePerma(payload));
        } else {
          dispatch(fetchReverseGeocodeIso(current, next));

          if ('range' in params && 'interval' in params) {
            const maxRangeName = 'maxRange';
            const intervalName = 'interval';
            const maxRangeValue = params.range;
            const intervalValue = params.interval;

            dispatch(
              updateIsoSettings({
                maxRangeName,
                intervalName,
                value: parseInt(maxRangeValue, 10),
              })
            );
            dispatch(
              updateIsoSettings({
                intervalName,
                value: parseInt(intervalValue, 10),
              })
            );
          }

          if ('denoise' in params) {
            dispatch(
              updateIsoSettings({
                denoiseName: 'denoise',
                value: parseInt(params.denoise, 10),
              })
            );
          }
          if ('generalize' in params) {
            dispatch(
              updateIsoSettings({
                generalizeName: 'generalize',
                value: parseInt(params.generalize, 10),
              })
            );
          }
        }
      });
      dispatch(zoomTo(processedCoords));
      dispatch(resetSettings());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { message } = props;
    if (!message) {
      return;
    }

    const prevReceivedAt = prevMessageRef.current;

    if (prevReceivedAt != null && message.receivedAt > prevReceivedAt) {
      toast[message.type!](message.description, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    }

    prevMessageRef.current = message.receivedAt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.message]);

  const handleTabChange = (
    event: React.MouseEvent<HTMLDivElement>,
    data: ButtonProps
  ) => {
    const { dispatch } = props;
    const newActiveTab = data.activeIndex;

    dispatch(updateTab({ activeTab: newActiveTab }));
    dispatch(updatePermalink());
  };

  const handleDirectionsToggle = () => {
    const { dispatch } = props;
    const { showDirectionsPanel } = props;
    if (!showDirectionsPanel) {
      document
        ?.getElementsByClassName('heightgraph-container')[0]
        ?.setAttribute('width', (window.innerWidth * 0.75).toString());
    } else {
      document
        ?.getElementsByClassName('heightgraph-container')[0]
        ?.setAttribute('width', (window.innerWidth * 0.9).toString());
    }
    dispatch(toggleDirections());
  };

  const appPanes = [
    {
      menuItem: {
        'data-testid': 'directions-tab-button',
        content: 'Directions',
      },
      render: () => (
        <Tab.Pane style={{ padding: '0 0 0 0' }} attached={false}>
          <DirectionsControl />
        </Tab.Pane>
      ),
    },
    {
      menuItem: {
        'data-testid': 'isochrones-tab-button',
        content: 'Isochrones',
      },
      render: () => (
        <Tab.Pane style={{ padding: '0 0 0 0' }} attached={false}>
          <IsochronesControl />
        </Tab.Pane>
      ),
    },
  ];

  return (
    <>
      <Button
        primary
        style={{
          zIndex: 998,
          top: '10px',
          left: '10px',
          position: 'absolute',
        }}
        onClick={handleDirectionsToggle}
        data-testid="open-directions-button"
      >
        {activeTab === 0 ? 'Directions' : 'Isochrones'}
      </Button>
      <Drawer
        enableOverlay={false}
        open={props.showDirectionsPanel}
        direction="left"
        size="400"
        style={{
          zIndex: 1000,
          overflow: 'auto',
        }}
      >
        <div>
          <Segment basic style={{ paddingBottom: 0 }}>
            <div>
              <Button
                icon
                style={{ float: 'right', marginLeft: '5px' }}
                onClick={handleDirectionsToggle}
                data-testid="close-directions-button"
              >
                <Icon name="close" />
              </Button>
              <Tab
                activeIndex={activeTab}
                onTabChange={handleTabChange}
                menu={{ pointing: true }}
                panes={appPanes}
              />
            </div>
          </Segment>
          {(activeTab === 0 && <DirectionOutputControl />) || (
            <IsochronesOutputControl />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            margin: '1rem',
          }}
        >
          Last Data Update:{' '}
          {lastUpdate
            ? `${lastUpdate.toISOString().slice(0, 10)}, ${lastUpdate
                .toISOString()
                .slice(11, 16)}`
            : '0000-00-00, 00:00'}
        </div>
      </Drawer>
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  const { message, activeTab, showDirectionsPanel } = state.common;
  return {
    message,
    activeTab,
    showDirectionsPanel,
  };
};

export default connect(mapStateToProps)(MainControl);
