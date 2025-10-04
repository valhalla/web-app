import React from 'react';
import { connect } from 'react-redux';
import { Icon } from 'semantic-ui-react';
import type { RootState } from '@/store';
import type { IsochroneState } from '@/reducers/isochrones';

interface ContoursInformationProps {
  results: IsochroneState['results'];
  provider: string;
}

type FeatureProperties = { area: number; contour: number } | null;

const ContoursInformation = ({
  results,
  provider,
}: ContoursInformationProps) => {
  const { features } = results[provider]!.data;

  // const handleChange = (data, event) => {
  //   const { dispatch } = this.props
  //   dispatch(showProvider(event.provider, event.checked))
  // }

  if (!features) {
    return <div>No isochrones found</div>;
  }

  return (
    <React.Fragment>
      {features
        .filter((feature) => !feature.properties?.type)
        .map((feature, key) => {
          const featureProperties = feature.properties as FeatureProperties;
          return (
            <div className="flex pb2" key={key}>
              <div
                className="flex"
                style={{
                  alignSelf: 'center',
                  flexBasis: '140px',
                }}
              >
                <Icon circular name="time" />
                <div className="pr2 f6 b pt1 pb1">
                  {featureProperties?.contour + ' minutes'}
                </div>
              </div>
              <div className="flex" style={{ alignSelf: 'center' }}>
                <Icon circular name="move" />
                <div className="pa1 b f6">
                  {(featureProperties?.area && featureProperties?.area > 1
                    ? featureProperties.area.toFixed(0)
                    : featureProperties?.area.toFixed(1)) + ' km²'}
                </div>
              </div>
            </div>
          );
        })}
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState) => {
  const { results } = state.isochrones;
  return {
    results,
  };
};

export default connect(mapStateToProps)(ContoursInformation);
