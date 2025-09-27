import { useState, useEffect, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import { Segment, Button, Icon } from 'semantic-ui-react';
import L from 'leaflet';

import { makeRequest } from '@/actions/directionsActions';
import { downloadFile } from '@/actions/commonActions';
import Summary from './Summary';
import Maneuvers from './Maneuvers';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
// @ts-expect-error todo: json-format is not typed
import jsonFormat from 'json-format';
import { jsonConfig } from '@/Controls/settings-options';
import type { RootState } from '@/store';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { DirectionsState } from '@/reducers/directions';

type ShowResultsState = Record<string | number, boolean>;

interface OutputControlProps {
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  activeTab: number;
  successful: boolean;
  results: DirectionsState['results'];
}

const OutputControl = ({
  dispatch,
  activeTab,
  successful,
  results,
}: OutputControlProps) => {
  const prevPropsRef = useRef<{ activeTab: number }>({ activeTab });

  const initializeShowResults = useCallback(() => {
    const routeResult = results[VALHALLA_OSM_URL!];
    const data = routeResult?.data;

    let alternates: number[] = [];

    if (data?.alternates) {
      alternates = data.alternates.map((_, i) => i);
    }

    return {
      '-1': false,
      ...alternates.reduce((acc, v) => ({ ...acc, [v]: false }), {}),
    };
  }, [results]);

  const [showResults, setShowResults] = useState<ShowResultsState>(() =>
    initializeShowResults()
  );

  useEffect(() => {
    if (
      prevPropsRef.current &&
      activeTab === 0 &&
      prevPropsRef.current.activeTab === 1
    ) {
      dispatch(makeRequest());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    prevPropsRef.current = { activeTab };
  });

  useEffect(() => {
    setShowResults(initializeShowResults());
  }, [initializeShowResults]);

  const showManeuvers = useCallback((idx: string | number) => {
    setShowResults((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }, []);

  const dateNow = useCallback((): string => {
    const dtNow = new Date();
    return (
      [dtNow.getMonth() + 1, dtNow.getDate(), dtNow.getFullYear()].join('/') +
      '_' +
      [dtNow.getHours(), dtNow.getMinutes(), dtNow.getSeconds()].join(':')
    );
  }, []);

  const exportToJson = useCallback(
    (e: React.MouseEvent) => {
      const routeResult = results[VALHALLA_OSM_URL!];
      const data = routeResult?.data;
      if (!data) return;
      const formattedData = jsonFormat(data, jsonConfig);
      e.preventDefault();
      downloadFile({
        data: formattedData,
        fileName: 'valhalla-directions_' + dateNow() + '.json',
        fileType: 'text/json',
      });
    },
    [results, dateNow]
  );

  const exportToGeoJson = useCallback(
    (e: React.MouseEvent) => {
      const routeResult = results[VALHALLA_OSM_URL!];
      const data = routeResult?.data;
      const coordinates = data?.decodedGeometry;
      if (!coordinates) return;
      const formattedData = jsonFormat(
        L.polyline(coordinates as L.LatLngExpression[]).toGeoJSON(),
        jsonConfig
      );
      e.preventDefault();
      downloadFile({
        data: formattedData,
        fileName: 'valhalla-directions_' + dateNow() + '.geojson',
        fileType: 'text/json',
      });
    },
    [results, dateNow]
  );

  const routeResult = results[VALHALLA_OSM_URL!];
  if (!routeResult?.data) {
    return null;
  }
  const data = routeResult.data;

  let alternates: React.ReactElement[] = [];
  if (data.alternates) {
    alternates = data.alternates.map((alternate, i) => {
      const legs = alternate.trip.legs;
      return (
        <Segment
          key={`alternate_${i}`}
          style={{
            margin: '0 1rem 10px',
            display: successful ? 'block' : 'none',
          }}
        >
          <div className="flex-column">
            <Summary
              header={`Alternate ${i + 1}`}
              idx={i}
              summary={alternate.trip.summary}
            />
            <div className="flex justify-between">
              <Button
                size="mini"
                toggle
                active={showResults[i]}
                onClick={() => showManeuvers(i)}
              >
                {showResults[i] ? 'Hide Maneuvers' : 'Show Maneuvers'}
              </Button>
              <div className="flex">
                <div
                  className="flex pointer"
                  style={{ alignSelf: 'center' }}
                  onClick={exportToJson}
                >
                  <Icon circular name="download" />
                  <div className="pa1 b f6">{'JSON'}</div>
                </div>
                <div
                  className="ml2 flex pointer"
                  style={{ alignSelf: 'center' }}
                  onClick={exportToGeoJson}
                >
                  <Icon circular name="download" />
                  <div className="pa1 b f6">{'GeoJSON'}</div>
                </div>
              </div>
            </div>

            {showResults[i] ? (
              <div data-testid={`maneuvers-list-${i}`} className="flex-column">
                <Maneuvers legs={legs} idx={i} />
              </div>
            ) : null}
          </div>
        </Segment>
      );
    });
  }
  if (!data.trip) {
    return null;
  }
  return (
    <>
      <Segment
        style={{
          margin: '0 1rem 10px',
          display: successful ? 'block' : 'none',
        }}
      >
        <div className="flex-column">
          <Summary header="Directions" summary={data.trip.summary} idx={-1} />
          <div className="flex justify-between">
            <Button
              size="mini"
              toggle
              active={showResults[-1]}
              onClick={() => showManeuvers(-1)}
            >
              {showResults[-1] ? 'Hide Maneuvers' : 'Show Maneuvers'}
            </Button>
            <div className="flex">
              <div
                className="flex pointer"
                style={{ alignSelf: 'center' }}
                onClick={exportToJson}
              >
                <Icon circular name="download" />
                <div className="pa1 b f6">{'JSON'}</div>
              </div>
              <div
                className="ml2 flex pointer"
                style={{ alignSelf: 'center' }}
                onClick={exportToGeoJson}
              >
                <Icon circular name="download" />
                <div className="pa1 b f6">{'GeoJSON'}</div>
              </div>
            </div>
          </div>

          {showResults[-1] ? (
            <div className="flex-column">
              <Maneuvers legs={data.trip.legs} idx={-1} />
            </div>
          ) : null}
        </div>
      </Segment>
      {alternates.length ? alternates : ''}
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  const { profile, activeTab } = state.common;
  const { successful, results } = state.directions;
  return {
    profile,
    activeTab,
    successful,
    results,
  };
};

export default connect(mapStateToProps)(OutputControl);
