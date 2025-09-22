import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Icon, Checkbox, Popup } from 'semantic-ui-react'
import { showProvider } from '../../actions/directionsActions'

import formatDuration from 'utils/date_time'
import { VALHALLA_OSM_URL } from 'utils/valhalla'

const Summary = ({
  dispatch,
  results,
  inclineDeclineTotal,
  summary,
  header,
  idx,
  provider,
}) => {
  const handleChange = useCallback(
    (event, data) => {
      dispatch(showProvider(data.provider, data.checked, idx))
    },
    [dispatch, idx]
  )

  if (!summary) {
    return <div>No route found</div>
  }

  return (
    <React.Fragment>
      <div className="flex mb1">
        <span className="b">{header}</span>
        {summary.has_highway && (
          <div style={{ marginLeft: '1em' }}>
            <Popup
              content={'Highway'}
              size={'tiny'}
              trigger={
                <div className={'flex'}>
                  <Icon
                    circular
                    name={'road'}
                    size="small"
                    style={{ marginRight: '-10px' }}
                  />
                  <div className={'dib pa1 f6'}></div>
                </div>
              }
            />
          </div>
        )}
        {summary.has_ferry && (
          <div style={{ marginLeft: '1em' }}>
            <Popup
              content={'Ferry'}
              size={'tiny'}
              trigger={
                <div className={'flex'}>
                  <Icon
                    circular
                    name={'ship'}
                    size="small"
                    style={{ marginRight: '-10px' }}
                  />
                  <div className={'dib pa1 f6'}></div>
                </div>
              }
            />
          </div>
        )}
        {summary.has_toll && (
          <div style={{ marginLeft: '1em' }}>
            <Popup
              content={'Toll'}
              size={'tiny'}
              style={{ marginRight: '-10px' }}
              trigger={
                <div className={'flex'}>
                  <Icon circular name={'dollar'} size="small" />
                  <div className={'dib pa1 f6'}></div>
                </div>
              }
            />
          </div>
        )}
      </div>
      <div className={'flex justify-between pb2 pointer'}>
        <div
          style={{
            alignSelf: 'center',
            flexBasis: '100px',
          }}
        >
          <Icon circular name={'arrows alternate horizontal'} size={'small'} />
          <div className={'dib v-mid pa1 b f6'}>
            {`${summary.length.toFixed(summary.length > 1000 ? 0 : 1)} km`}
          </div>
        </div>
        <div
          style={{
            alignSelf: 'center',
            flexGrow: 1,
          }}
        >
          <Icon circular name={'time'} size="small" />
          <div className={'dib v-mid pa1 b f6'}>
            {formatDuration(summary.time)}
          </div>
        </div>
        <div style={{ alignSelf: 'center' }}>
          <Checkbox
            slider
            label={'Map'}
            checked={results[VALHALLA_OSM_URL].show[idx]}
            provider={VALHALLA_OSM_URL}
            onChange={handleChange}
          />
        </div>
      </div>
      {inclineDeclineTotal && (
        <div className={'flex pb3 pointer'}>
          <div
            style={{
              alignSelf: 'center',
              marginRight: '1em',
            }}
          >
            <Popup
              content={'Total Incline'}
              size={'tiny'}
              trigger={
                <div>
                  <Icon circular name={'arrow up'} size={'small'} />
                  <div className={'dib v-mid pa1 b f6'}>
                    {`${inclineDeclineTotal.inclineTotal} m`}
                  </div>
                </div>
              }
            />
          </div>
          <div
            style={{
              alignSelf: 'center',
              flexBasis: '100px',
            }}
          >
            <Popup
              content={'Total Decline'}
              size={'tiny'}
              trigger={
                <div>
                  <Icon circular name={'arrow down'} size={'small'} />
                  <div className={'dib v-mid pa1 b f6'}>
                    {`${inclineDeclineTotal.declineTotal} m`}
                  </div>
                </div>
              }
            />
          </div>
        </div>
      )}
    </React.Fragment>
  )
}

Summary.propTypes = {
  dispatch: PropTypes.func.isRequired,
  results: PropTypes.object,
  inclineDeclineTotal: PropTypes.object,
  summary: PropTypes.object.isRequired,
  header: PropTypes.string.isRequired,
  idx: PropTypes.number.isRequired,
  provider: PropTypes.string,
}

const mapStateToProps = (state) => {
  const { results, inclineDeclineTotal } = state.directions
  return {
    results,
    inclineDeclineTotal,
  }
}

export default connect(mapStateToProps)(Summary)
