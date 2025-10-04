import React, { useState, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Search,
  Icon,
  Label,
  Popup,
  type SearchResultProps,
} from 'semantic-ui-react';
import {
  doRemoveWaypoint,
  updateTextInput,
  fetchGeocode,
  makeRequest,
  isWaypoint,
} from '@/actions/directions-actions';

import { zoomTo } from '@/actions/common-actions';
import { isValidCoordinates } from '@/utils/geom';

import { debounce } from 'throttle-debounce';
import type { RootState } from '@/store';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { ActiveWaypoint } from '@/common/types';

interface WaypointProps {
  index: number;
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  userInput: string;
  isFetching: boolean;
  use_geocoding: boolean;
  geocodeResults: ActiveWaypoint[];
}

const Waypoint = ({
  index,
  dispatch,
  userInput,
  isFetching,
  use_geocoding,
  geocodeResults,
}: WaypointProps) => {
  const [open, setOpen] = useState(false);

  const fetchGeocodeResults = useMemo(
    () =>
      debounce(0, (e) => {
        setOpen(true);

        if (userInput.length > 0 && e === 'Enter') {
          // make results visible
          if (use_geocoding) {
            dispatch(
              fetchGeocode({
                inputValue: userInput,
                index: index,
              })
            );
          } else {
            const coords = userInput.split(/[\s,;]+/);
            // is this a coordinate?
            if (coords.length === 2) {
              const lat = coords[1];
              const lng = coords[0];
              if (isValidCoordinates(lat!, lng!)) {
                dispatch(
                  fetchGeocode({
                    inputValue: userInput,
                    index: index,
                    lngLat: [parseFloat(lng!), parseFloat(lat!)],
                  })
                );
              }
            }
          }
        }
      }),
    [dispatch, index, userInput, use_geocoding]
  );

  const handleSearchChange = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      dispatch(
        updateTextInput({
          inputValue: (event.target as HTMLInputElement).value,
          index: index,
        })
      );
      dispatch(isWaypoint(index));
    },
    [dispatch, index]
  );

  const handleResultSelect = useCallback(
    (e, { result }: { result: ActiveWaypoint }) => {
      setOpen(false);
      dispatch(zoomTo([[result.addresslnglat![1], result.addresslnglat![0]]]));
      dispatch(
        updateTextInput({
          inputValue: result.title,
          index: index,
          addressindex: result.addressindex,
        })
      );
      dispatch(makeRequest());
    },
    [dispatch, index]
  );

  const resultRenderer = useCallback(
    ({ title, description }: SearchResultProps) => (
      <div data-testid="search-result" className="flex-column">
        <div>
          <span className="title">{title}</span>
        </div>
        {description && description.length > 0 && (
          <div>
            <Icon disabled name="linkify" />
            <span className="description b">
              <a target="_blank" rel="noopener noreferrer" href={description}>
                OSM Link
              </a>
            </span>
          </div>
        )}
      </div>
    ),
    []
  );

  return (
    <React.Fragment>
      <div className="flex flex-row justify-between items-center">
        <Popup
          content="Re-shuffle this waypoint"
          size="tiny"
          trigger={
            <Label basic size="small">
              <Icon name="ellipsis vertical" />
              {index + 1}
            </Label>
          }
        />

        <Popup
          content={userInput.length === 0 ? 'Enter Address' : userInput}
          size="tiny"
          mouseEnterDelay={500}
          trigger={
            <Search
              className={'pa2 ' + index}
              size="small"
              fluid
              input={{ icon: 'search', iconPosition: 'left' }}
              onSearchChange={handleSearchChange}
              onResultSelect={handleResultSelect}
              resultRenderer={resultRenderer}
              type="text"
              showNoResults={false}
              open={open}
              onFocus={() => setOpen(true)}
              onMouseDown={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              loading={isFetching}
              results={geocodeResults}
              value={userInput}
              onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
                fetchGeocodeResults(event.key);
              }}
              placeholder="Hit enter for search..."
              data-testid={'waypoint-input-' + index}
            />
          }
        />
        <div style={{ margin: '3px' }}>
          <Popup
            content={
              use_geocoding ? 'Search for address' : 'Enter Lon/lat coordinates'
            }
            size="tiny"
            trigger={
              <Icon
                className="pointer"
                name="checkmark"
                disabled={userInput.length === 0}
                // size="32px"
                size="tiny"
                onClick={() => fetchGeocodeResults('Enter')}
              />
            }
          />
        </div>
        <div style={{ margin: '3px' }}>
          <Popup
            content="Remove this waypoint"
            size="tiny"
            trigger={
              <Icon
                data-testid="remove-waypoint-button"
                className="pointer"
                name="remove"
                // size="32px"
                size="tiny"
                onClick={() => dispatch(doRemoveWaypoint(index))}
              />
            }
          />
        </div>
      </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState, ownProps: { index: number }) => {
  const { index } = ownProps;
  const waypoint = state.directions.waypoints[index];
  const { geocodeResults, userInput, isFetching } = waypoint!;
  const { use_geocoding } = state.common.settings;
  return {
    userInput,
    geocodeResults,
    isFetching,
    use_geocoding,
  };
};
export default connect(mapStateToProps)(Waypoint);
