import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { Header, Icon, Divider, Popup } from 'semantic-ui-react';

import {
  highlightManeuver,
  zoomToManeuver,
} from '@/actions/directions-actions';
import type { RootState } from '@/store';
import type { ThunkDispatch } from 'redux-thunk';
import type { Leg } from '@/common/types';
import type { AnyAction } from 'redux';

const getLength = (length: number) => {
  const visibleLength = length * 1000;
  if (visibleLength < 1000) {
    return visibleLength + 'm';
  }
  return (visibleLength / 1000).toFixed(2) + 'km';
};

interface ManeuversProps {
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  legs: Leg[];
  idx: number;
}

const Maneuvers = ({ dispatch, legs, idx }: ManeuversProps) => {
  const highlightMnv = useCallback(
    (sIdx: number, eIdx: number) => {
      dispatch(
        highlightManeuver({ startIndex: sIdx, endIndex: eIdx, alternate: idx })
      );
    },
    [dispatch, idx]
  );

  const zoomToMnv = useCallback(
    (sIdx: number) => {
      dispatch(zoomToManeuver({ index: sIdx, timeNow: Date.now() }));
    },
    [dispatch]
  );

  const startIndices: number[] = [0];

  if (legs) {
    for (let i = 0; i < legs.length - 1; i++) {
      const endShapeIndex =
        legs[i]!.maneuvers[legs[i]!.maneuvers.length - 1]!.end_shape_index;
      startIndices[i + 1] = endShapeIndex;
    }
  }

  return (
    <React.Fragment>
      {legs?.map((leg, i) =>
        leg.maneuvers.map((mnv, j) => (
          <React.Fragment key={j}>
            <div
              style={{ maxWidth: '300px' }}
              className="flex-column pt3 pb3 pointer"
              onMouseEnter={() =>
                highlightMnv(
                  startIndices[i]! + mnv.begin_shape_index,
                  startIndices[i]! + mnv.end_shape_index
                )
              }
              onMouseLeave={() =>
                highlightMnv(
                  startIndices[i]! + mnv.begin_shape_index,
                  startIndices[i]! + mnv.end_shape_index
                )
              }
              onClick={() =>
                zoomToMnv(startIndices[i]! + mnv.begin_shape_index)
              }
            >
              <div className="pb2">
                <Header as="h4">{mnv.instruction}</Header>
              </div>
              {mnv.type !== 4 && mnv.type !== 5 && mnv.type !== 6 && (
                <div className="flex justify-between">
                  <div
                    style={{
                      alignSelf: 'center',
                      flexBasis: '100px',
                    }}
                  >
                    <Icon
                      circular
                      name="arrows alternate horizontal"
                      size="small"
                    />
                    <div className="dib pa1 f6">{getLength(mnv.length)}</div>
                  </div>
                  <div
                    style={{
                      alignSelf: 'center',
                      flexGrow: 1,
                    }}
                  >
                    <Icon circular name="time" size="small" />
                    <div className="dib pa1 f6">
                      {new Date(mnv.time * 1000).toISOString().substr(11, 8)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        mnv.toll && mnv.ferry ? 'space-between' : 'flex-start',
                      flexBasis: '80px',
                    }}
                  >
                    {mnv.toll && (
                      <div className="flex align-center">
                        <Popup
                          content="Toll"
                          size="tiny"
                          offset={[-6, 0]}
                          trigger={
                            <div>
                              <Icon circular name="dollar" size="small" />
                              <div className="dib pa1 f6"></div>
                            </div>
                          }
                        />
                      </div>
                    )}
                    {mnv.ferry && (
                      <div className="flex align-center">
                        <Popup
                          content="Ferry"
                          size="tiny"
                          offset={[-6, 0]}
                          trigger={
                            <div>
                              <Icon circular name="ship" size="small" />
                              <div className="dib pa1 f6"></div>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {mnv.type !== 4 && mnv.type !== 5 && mnv.type !== 6 && (
              <Divider fitted />
            )}
          </React.Fragment>
        ))
      )}
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState) => {
  const { results } = state.directions;
  return {
    results,
  };
};

export default connect(mapStateToProps)(Maneuvers);
