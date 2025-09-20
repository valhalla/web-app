import React, { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Segment, Button, Icon } from 'semantic-ui-react'
import L from 'leaflet'

import { makeRequest } from 'actions/directionsActions'
import { downloadFile } from 'actions/commonActions'
import Summary from './Summary'
import Maneuvers from './Maneuvers'
import { VALHALLA_OSM_URL } from 'utils/valhalla'
import jsonFormat from 'json-format'
import { jsonConfig } from 'Controls/settings-options'

const OutputControl = ({
  dispatch,
  profile,
  activeTab,
  successful,
  results,
}) => {
  const prevPropsRef = useRef()

  const initializeShowResults = useCallback(() => {
    const { data } = results[VALHALLA_OSM_URL]
    let alternates = []

    if (data.alternates) {
      alternates = data.alternates.map((_, i) => i)
    }

    return {
      '-1': false,
      ...alternates.reduce((acc, v) => ({ ...acc, [v]: false }), {}),
    }
  }, [results])

  const [showResults, setShowResults] = useState(() => initializeShowResults())

  useEffect(() => {
    if (
      prevPropsRef.current &&
      activeTab === 0 &&
      prevPropsRef.current.activeTab === 1
    ) {
      dispatch(makeRequest())
    }
  }, [activeTab, dispatch])

  useEffect(() => {
    prevPropsRef.current = { activeTab }
  })

  useEffect(() => {
    setShowResults(initializeShowResults())
  }, [initializeShowResults])

  const showManeuvers = useCallback((idx) => {
    setShowResults((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }, [])

  const dateNow = useCallback(() => {
    let dtNow = new Date()
    dtNow =
      [dtNow.getMonth() + 1, dtNow.getDate(), dtNow.getFullYear()].join('/') +
      '_' +
      [dtNow.getHours(), dtNow.getMinutes(), dtNow.getSeconds()].join(':')
    return dtNow
  }, [])

  const exportToJson = useCallback(
    (e) => {
      const { data } = results[VALHALLA_OSM_URL]
      const formattedData = jsonFormat(data, jsonConfig)
      e.preventDefault()
      downloadFile({
        data: formattedData,
        fileName: 'valhalla-directions_' + dateNow() + '.json',
        fileType: 'text/json',
      })
    },
    [results, dateNow]
  )

  const exportToGeoJson = useCallback(
    (e) => {
      const coordinates = results[VALHALLA_OSM_URL].data.decodedGeometry
      const formattedData = jsonFormat(
        L.polyline(coordinates).toGeoJSON(),
        jsonConfig
      )
      e.preventDefault()
      downloadFile({
        data: formattedData,
        fileName: 'valhalla-directions_' + dateNow() + '.geojson',
        fileType: 'text/json',
      })
    },
    [results, dateNow]
  )

  const data = results[VALHALLA_OSM_URL].data

  let alternates = []
  if (data.alternates) {
    alternates = data.alternates.map((alternate, i) => {
      const legs = alternate.trip.legs
      return (
        <Segment
          key={`alternate_${i}`}
          style={{
            margin: '0 1rem 10px',
            display: successful ? 'block' : 'none',
          }}
        >
          <div className={'flex-column'}>
            <Summary
              header={`Alternate ${i + 1}`}
              idx={i}
              summary={alternate.trip.summary}
            />
            <div className={'flex justify-between'}>
              <Button
                size="mini"
                toggle
                active={showResults[i]}
                onClick={() => showManeuvers(i)}
              >
                {showResults[i] ? 'Hide Maneuvers' : 'Show Maneuvers'}
              </Button>
              <div className={'flex'}>
                <div
                  className={'flex pointer'}
                  style={{ alignSelf: 'center' }}
                  onClick={exportToJson}
                >
                  <Icon circular name={'download'} />
                  <div className={'pa1 b f6'}>{'JSON'}</div>
                </div>
                <div
                  className={'ml2 flex pointer'}
                  style={{ alignSelf: 'center' }}
                  onClick={exportToGeoJson}
                >
                  <Icon circular name={'download'} />
                  <div className={'pa1 b f6'}>{'GeoJSON'}</div>
                </div>
              </div>
            </div>

            {showResults[i] ? (
              <div
                data-testid={`maneuvers-list-${i}`}
                className={'flex-column'}
              >
                <Maneuvers legs={legs} idx={i} />
              </div>
            ) : null}
          </div>
        </Segment>
      )
    })
  }
  if (!data.trip) {
    return ''
  }
  return (
    <>
      <Segment
        style={{
          margin: '0 1rem 10px',
          display: successful ? 'block' : 'none',
        }}
      >
        <div className={'flex-column'}>
          <Summary header={'Directions'} summary={data.trip.summary} idx={-1} />
          <div className={'flex justify-between'}>
            <Button
              size="mini"
              toggle
              active={showResults[-1]}
              onClick={() => showManeuvers(-1)}
            >
              {showResults[-1] ? 'Hide Maneuvers' : 'Show Maneuvers'}
            </Button>
            <div className={'flex'}>
              <div
                className={'flex pointer'}
                style={{ alignSelf: 'center' }}
                onClick={exportToJson}
              >
                <Icon circular name={'download'} />
                <div className={'pa1 b f6'}>{'JSON'}</div>
              </div>
              <div
                className={'ml2 flex pointer'}
                style={{ alignSelf: 'center' }}
                onClick={exportToGeoJson}
              >
                <Icon circular name={'download'} />
                <div className={'pa1 b f6'}>{'GeoJSON'}</div>
              </div>
            </div>
          </div>

          {showResults[-1] ? (
            <div className={'flex-column'}>
              <Maneuvers
                legs={data.trip ? data.trip.legs : undefined}
                idx={-1}
              />
            </div>
          ) : null}
        </div>
      </Segment>
      {alternates.length ? alternates : ''}
    </>
  )
}

OutputControl.propTypes = {
  dispatch: PropTypes.func.isRequired,
  profile: PropTypes.string,
  activeTab: PropTypes.number,
  successful: PropTypes.bool,
  results: PropTypes.object,
}

const mapStateToProps = (state) => {
  const { profile, activeTab } = state.common
  const { successful, results } = state.directions
  return {
    profile,
    activeTab,
    successful,
    results,
  }
}

export default connect(mapStateToProps)(OutputControl)
