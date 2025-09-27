import { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Segment, Divider } from 'semantic-ui-react';

import Summary from './Summary';
import { makeIsochronesRequest } from '@/actions/isochronesActions';
import ContoursInformation from './ContoursInformation';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
import type { RootState } from '@/store';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';

interface OutputControlProps {
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  activeTab: number;
  successful: boolean;
}

const OutputControl = ({
  dispatch,
  activeTab,
  successful,
}: OutputControlProps) => {
  const prevPropsRef = useRef<{ activeTab: number }>({ activeTab });

  // Handle activeTab changes - make API request when switching from directions to isochrones tab
  // necessary to calculate new routes the tab was changed from isochrone tab
  // need to do this every time, because "profile" is global (otherwise we would
  // calculate new when the profile was changed while being on the iso tab)
  useEffect(() => {
    if (
      prevPropsRef.current &&
      activeTab === 1 &&
      prevPropsRef.current.activeTab === 0
    ) {
      dispatch(makeIsochronesRequest());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    prevPropsRef.current = { activeTab };
  });

  if (activeTab === 0) {
    return null;
  }

  return (
    <Segment
      style={{
        margin: '0 1rem 10px',
        display: successful ? 'block' : 'none',
      }}
    >
      <div className="flex-column">
        <div className="flex justify-between pointer">
          <Summary provider={VALHALLA_OSM_URL!} />
        </div>
        <Divider />
        <ContoursInformation provider={VALHALLA_OSM_URL!} />
      </div>
    </Segment>
  );
};

const mapStateToProps = (state: RootState) => {
  const { profile, activeTab } = state.common;
  const { successful } = state.isochrones;
  return {
    profile,
    activeTab,
    successful,
  };
};

export default connect(mapStateToProps)(OutputControl);
