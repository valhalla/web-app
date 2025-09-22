import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';
import { Checkbox, Icon } from 'semantic-ui-react';
import { showProvider } from '@/actions/directionsActions';

import { downloadFile } from '@/actions/commonActions';
// @ts-expect-error todo: json-format is not typed
import jsonFormat from 'json-format';
import { jsonConfig } from '@/Controls/settings-options';
import type { RootState } from '@/store';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { IsochroneState } from '@/reducers/isochrones';

interface SummaryProps {
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  results: IsochroneState['results'];
  provider: string;
}

const Summary = ({ dispatch, results, provider }: SummaryProps) => {
  const handleChange = useCallback(
    (event, data) => {
      dispatch(showProvider(data.provider, data.checked));
    },
    [dispatch]
  );

  const exportToJson = useCallback(
    (e) => {
      const data = R.path([provider, 'data'], results);

      const dateNow = new Date();
      const dformat =
        [dateNow.getMonth() + 1, dateNow.getDate(), dateNow.getFullYear()].join(
          '/'
        ) +
        '_' +
        [dateNow.getHours(), dateNow.getMinutes(), dateNow.getSeconds()].join(
          ':'
        );
      const formattedData = jsonFormat(data, jsonConfig);
      e.preventDefault();
      downloadFile({
        data: formattedData,
        fileName: 'valhalla-isochrones_' + dformat + '.geojson',
        fileType: 'text/json',
      });
    },
    [provider, results]
  );

  const data = R.path([provider, 'data'], results);

  return (
    <React.Fragment>
      {'features' in data ? (
        <React.Fragment>
          <div className="pr2" style={{ alignSelf: 'center' }}>
            <span className="b">Isochrones</span>
          </div>
          <div
            className="flex pointer"
            style={{ alignSelf: 'center' }}
            onClick={exportToJson}
          >
            <Icon circular name="download" />
            <div className="pa1 b f6">{'Download'}</div>
          </div>
          <div style={{ alignSelf: 'center' }}>
            <Checkbox
              slider
              label="Map"
              checked={results[provider]!.show}
              provider={provider}
              onChange={handleChange}
            />
          </div>
        </React.Fragment>
      ) : (
        <div>No isochrones found</div>
      )}
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState) => {
  const { results } = state.isochrones;
  return {
    results,
  };
};

export default connect(mapStateToProps)(Summary);
