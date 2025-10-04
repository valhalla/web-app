import { useState, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';

import {
  Search,
  Form,
  Popup,
  Icon,
  Label,
  Accordion,
  type SearchResultProps,
  type AccordionTitleProps,
  type SearchProps,
} from 'semantic-ui-react';
import { Slider } from '@mui/material';

import { Settings } from '../settings';

import { isValidCoordinates } from '@/utils/geom';
import {
  updateTextInput,
  updateIsoSettings,
  fetchGeocode,
  makeIsochronesRequest,
  clearIsos,
} from '@/actions/isochrones-actions';

import {
  denoise as denoiseParam,
  generalize as generalizeParam,
  settingsInit,
} from '@/controls/settings-options';

import { updatePermalink, zoomTo } from '@/actions/common-actions';

import { debounce } from 'throttle-debounce';
import type { RootState } from '@/store';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { IsochroneState } from '@/reducers/isochrones';
import type { ActiveWaypoint, UpdateIsoSettingsObject } from '@/common/types';

interface WaypointsProps {
  isochrones: IsochroneState;
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  use_geocoding: boolean;
}

const Waypoints = ({ isochrones, dispatch, use_geocoding }: WaypointsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchGeocodeResults = useMemo(
    () =>
      debounce(200, (e) => {
        const { userInput } = isochrones;

        setOpen(true);

        if (userInput.length > 0 && e === 'Enter') {
          // make results visible
          if (use_geocoding) {
            dispatch(fetchGeocode(userInput));
          } else {
            const coords = userInput.split(/[\s,;]+/);
            // is this a coordinate?
            if (coords.length === 2) {
              const lat = coords[1];
              const lng = coords[0];
              if (isValidCoordinates(lat!, lng!)) {
                dispatch(
                  fetchGeocode(userInput, [parseFloat(lng!), parseFloat(lat!)])
                );
              }
            }
          }
        }
      }),
    [isochrones, use_geocoding, dispatch]
  );

  const handleIsoSliderUpdateSettings = useMemo(
    () =>
      debounce(
        10,
        ({
          value,
          maxRangeName,
          intervalName,
          denoiseName,
          generalizeName,
        }: UpdateIsoSettingsObject) => {
          // maxRangeName can be undefined if interval is being updated
          dispatch(
            updateIsoSettings({
              maxRangeName,
              intervalName,
              denoiseName,
              generalizeName,
              value,
            })
          );

          dispatch(updatePermalink());
        }
      ),
    [dispatch]
  );

  const makeIsochronesRequestDebounced = useMemo(
    () => debounce(100, () => dispatch(makeIsochronesRequest())),
    [dispatch]
  );

  const handleClick = useCallback(
    (e, titleProps: AccordionTitleProps) => {
      const { index } = titleProps;
      const newIndex = activeIndex === index ? -1 : index;
      setActiveIndex(newIndex as number);
    },
    [activeIndex]
  );

  const handleSearchChange = useCallback(
    (event, input: SearchProps) => {
      dispatch(updateTextInput({ userInput: input.value! }));
    },
    [dispatch]
  );

  const handleRemoveIsos = useCallback(() => {
    dispatch(clearIsos());
  }, [dispatch]);

  const handleResultSelect = useCallback(
    (e, { result }: { result: ActiveWaypoint }) => {
      setOpen(false);

      dispatch(
        updateTextInput({
          userInput: result.title,
          addressindex: result.addressindex,
        })
      );
      dispatch(zoomTo([[result.addresslnglat![1], result.addresslnglat![0]]]));
      makeIsochronesRequestDebounced();
    },
    [dispatch, makeIsochronesRequestDebounced]
  );

  const handleIntervalChange = useCallback(
    (e, input: { value: string }) => {
      const { maxRange } = isochrones;

      const value = Math.min(parseInt(input.value) || 0, maxRange);

      const intervalName = 'interval';

      handleIsoSliderUpdateSettings({
        intervalName,
        value,
      });
    },
    [isochrones, handleIsoSliderUpdateSettings]
  );

  const handleDenoiseChange = useCallback(
    (e, input: { value: string }) => {
      const value = parseInt(input.value) || settingsInit.denoise;

      const denoiseName = 'denoise';

      handleIsoSliderUpdateSettings({
        denoiseName,
        value,
      });
    },
    [handleIsoSliderUpdateSettings]
  );

  const handleGeneralizeChange = useCallback(
    (e, input: { value: string }) => {
      const value = parseInt(input.value) || settingsInit.generalize;

      const generalizeName = 'generalize';

      handleIsoSliderUpdateSettings({
        generalizeName,
        value,
      });
    },
    [handleIsoSliderUpdateSettings]
  );

  const handleRangeChange = useCallback(
    (e, input: { value: string }) => {
      const value = Math.min(parseInt(input.value) || 0, 120);

      const maxRangeName = 'maxRange';
      const intervalName = 'interval';

      handleIsoSliderUpdateSettings({
        maxRangeName,
        intervalName,
        value,
      });
      makeIsochronesRequestDebounced();
    },
    [handleIsoSliderUpdateSettings, makeIsochronesRequestDebounced]
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

  const {
    isFetching,
    geocodeResults,
    userInput,
    maxRange,
    interval,
    denoise,
    generalize,
  } = isochrones;

  const controlSettings = {
    maxRange: {
      name: 'Maximum Range',
      param: 'maxRange',
      description: 'The maximum range in minutes',
      unit: 'mins',
      settings: {
        min: 1,
        max: 120,
        step: 1,
      },
    },
    interval: {
      name: 'Interval Step',
      param: 'interval',
      description: 'The interval length in minutes.',
      unit: 'mins',
      settings: {
        min: 1,
        max: maxRange,
        step: 1,
      },
    },
    generalize: generalizeParam,
    denoise: denoiseParam,
  };

  return (
    <div>
      <div
        className="pa2 flex flex-row justify-between"
        style={{ alignItems: 'center' }}
      >
        <Popup
          content={userInput.length === 0 ? 'Enter Address' : userInput}
          size="tiny"
          mouseEnterDelay={500}
          trigger={
            <Search
              size="small"
              type="text"
              minCharacters={3}
              className="pt2 pb2 pl3"
              input={{ icon: 'search', iconPosition: 'left' }}
              onSearchChange={handleSearchChange}
              onResultSelect={handleResultSelect}
              resultRenderer={resultRenderer}
              showNoResults={false}
              open={open}
              onFocus={() => setOpen(true)}
              onMouseDown={() => setOpen(true)}
              loading={isFetching}
              results={geocodeResults}
              value={userInput}
              onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
                fetchGeocodeResults(event.key);
              }}
              placeholder="Hit enter for search..."
            />
          }
        />
        <Settings handleRemoveIsos={handleRemoveIsos} />
      </div>
      <div className="pa2">
        <Accordion>
          <Accordion.Title
            active={activeIndex === 0}
            index={0}
            onClick={handleClick}
          >
            <Icon name="dropdown" />
            <span className="f5">Settings</span>
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 0}>
            <Form size="small">
              <div className="pt3 pl3 pr3">
                <Form.Group inline>
                  <Form.Input
                    width={12}
                    size="small"
                    label={
                      <div className="flex flex-row align-top">
                        <span className="custom-label">
                          {controlSettings.maxRange.name}
                        </span>
                        <Popup
                          content={controlSettings.maxRange.description}
                          size="tiny"
                          trigger={
                            <Icon
                              className="pl2"
                              color="grey"
                              name="help circle"
                            />
                          }
                        />
                      </div>
                    }
                    value={maxRange}
                    type="number"
                    step="1"
                    placeholder="Enter Value"
                    name={controlSettings.maxRange.param}
                    onChange={handleRangeChange}
                  />
                  <Popup
                    content="Units"
                    size="tiny"
                    trigger={
                      <Label
                        basic
                        size="small"
                        style={{
                          cursor: 'default',
                        }}
                      >
                        {controlSettings.maxRange.unit}
                      </Label>
                    }
                  />
                </Form.Group>
                <div className="mb2 pa2">
                  <Slider
                    min={controlSettings.maxRange.settings.min}
                    max={controlSettings.maxRange.settings.max}
                    step={controlSettings.maxRange.settings.step}
                    value={maxRange}
                    color="secondary"
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(e) => {
                      const maxRangeName = controlSettings.maxRange.param;
                      const intervalName = controlSettings.interval.param;
                      handleIsoSliderUpdateSettings({
                        maxRangeName,
                        intervalName,
                        value: parseFloat((e.target as HTMLInputElement).value),
                      });
                    }}
                    onChangeCommitted={() => {
                      makeIsochronesRequestDebounced();
                    }}
                  />
                </div>
              </div>
              <div className="pt3 pl3 pr3">
                <Form.Group inline>
                  <Form.Input
                    width={12}
                    size="small"
                    label={
                      <div className="flex flex-row align-top">
                        <span className="custom-label">
                          {controlSettings.interval.name}
                        </span>
                        <Popup
                          content={controlSettings.interval.description}
                          size="tiny"
                          trigger={
                            <Icon
                              className="pl2"
                              color="grey"
                              name="help circle"
                            />
                          }
                        />
                      </div>
                    }
                    value={interval}
                    placeholder="Enter Value"
                    name={controlSettings.interval.param}
                    onChange={handleIntervalChange}
                  />
                  <Popup
                    content="Units"
                    size="tiny"
                    trigger={
                      <Label
                        basic
                        size="small"
                        style={{
                          cursor: 'default',
                        }}
                      >
                        {controlSettings.interval.unit}
                      </Label>
                    }
                  />
                </Form.Group>
                <div className="mb2 pa2">
                  <Slider
                    min={controlSettings.interval.settings.min}
                    max={controlSettings.interval.settings.max}
                    step={controlSettings.interval.settings.step}
                    value={interval}
                    color="secondary"
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(e) => {
                      const intervalName = controlSettings.interval.param;
                      handleIsoSliderUpdateSettings({
                        intervalName,
                        value: parseFloat((e.target as HTMLInputElement).value),
                      });
                    }}
                    onChangeCommitted={() => {
                      makeIsochronesRequestDebounced();
                    }}
                  />
                </div>
              </div>
              <div className="pt3 pl3 pr3">
                <Form.Group inline>
                  <Form.Input
                    width={12}
                    size="small"
                    label={
                      <div className="flex flex-row align-top">
                        <span className="custom-label">
                          {controlSettings.denoise.name}
                        </span>
                        <Popup
                          content={controlSettings.denoise.description}
                          size="tiny"
                          trigger={
                            <Icon
                              className="pl2"
                              color="grey"
                              name="help circle"
                            />
                          }
                        />
                      </div>
                    }
                    value={denoise}
                    placeholder="Enter Value"
                    name={controlSettings.denoise.param}
                    onChange={handleDenoiseChange}
                  />
                </Form.Group>
                <div className="mb2 pa2">
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={denoise}
                    color="secondary"
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(e) => {
                      const param = controlSettings.denoise.param;
                      handleIsoSliderUpdateSettings({
                        denoiseName: param,
                        value: parseFloat((e.target as HTMLInputElement).value),
                      });
                    }}
                    onChangeCommitted={() => {
                      makeIsochronesRequestDebounced();
                    }}
                  />
                </div>
              </div>
              <div className="pt3 pl3 pr3">
                <Form.Group inline>
                  <Form.Input
                    width={12}
                    size="small"
                    label={
                      <div className="flex flex-row align-top">
                        <span className="custom-label">
                          {controlSettings.generalize.name}
                        </span>
                        <Popup
                          content={controlSettings.generalize.description}
                          size="tiny"
                          trigger={
                            <Icon
                              className="pl2"
                              color="grey"
                              name="help circle"
                            />
                          }
                        />
                      </div>
                    }
                    value={generalize}
                    placeholder="Enter Value"
                    name={controlSettings.generalize.param}
                    onChange={handleGeneralizeChange}
                  />
                  <Popup
                    content="Units"
                    size="tiny"
                    trigger={
                      <Label
                        basic
                        size="small"
                        style={{
                          cursor: 'default',
                        }}
                      >
                        {controlSettings.generalize.unit}
                      </Label>
                    }
                  />
                </Form.Group>
                <div className="mb2 pa2">
                  <Slider
                    min={controlSettings.generalize.settings.min}
                    max={controlSettings.generalize.settings.max}
                    step={controlSettings.generalize.settings.step}
                    value={generalize}
                    color="secondary"
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(e) => {
                      const param = controlSettings.generalize.param;
                      handleIsoSliderUpdateSettings({
                        generalizeName: param,
                        value: parseFloat((e.target as HTMLInputElement).value),
                      });
                    }}
                    onChangeCommitted={() => {
                      makeIsochronesRequestDebounced();
                    }}
                  />
                </div>
              </div>
            </Form>
          </Accordion.Content>
        </Accordion>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  const { isochrones } = state;
  const { use_geocoding } = state.common.settings;

  return {
    isochrones,
    use_geocoding,
  };
};

export default connect(mapStateToProps)(Waypoints);
