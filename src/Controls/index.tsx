import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Drawer from 'react-modern-drawer'
import 'react-modern-drawer/dist/index.css'
import { toast } from 'react-toastify'
import DirectionsControl from './Directions'
import IsochronesControl from './Isochrones'
import DirectionOutputControl from './Directions/OutputControl'
import IsochronesOutputControl from './Isochrones/OutputControl'
import { Segment, Tab, Button, Icon } from 'semantic-ui-react'
import {
  updateTab,
  updateProfile,
  updatePermalink,
  zoomTo,
  resetSettings,
  toggleDirections,
} from 'actions/commonActions'
import { fetchReverseGeocodePerma } from 'actions/directionsActions'
import {
  fetchReverseGeocodeIso,
  updateIsoSettings,
} from 'actions/isochronesActions'
import { VALHALLA_OSM_URL } from 'utils/valhalla'

const pairwise = (arr, func) => {
  let cnt = 0
  for (let i = 0; i < arr.length - 1; i += 2) {
    func(arr[i], arr[i + 1], cnt)
    cnt += 1
  }
}

export const MainControl = (props) => {
  const { activeTab } = props
  const [lastUpdate, setLastUpdate] = React.useState(null)
  const prevMessageRef = React.useRef(null)

  const getLastUpdate = async () => {
    const response = await fetch(`${VALHALLA_OSM_URL}/status`)
    const data = await response.json()
    setLastUpdate(new Date(data.tileset_last_modified * 1000))
  }

  useEffect(() => {
    const { dispatch } = props

    getLastUpdate()

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
    )

    const params = Object.fromEntries(new URL(document.location).searchParams)

    if ('profile' in params) {
      dispatch(updateProfile({ profile: params.profile }))
    }

    if (
      window.location.pathname === '/' ||
      window.location.pathname === '/directions'
    ) {
      dispatch(updateTab({ activeTab: 0 }))
    } else if (window.location.pathname === '/isochrones') {
      dispatch(updateTab({ activeTab: 1 }))
    }

    if ('wps' in params && params.wps.length > 0) {
      const coordinates = params.wps.split(',').map(Number)
      const processedCoords = []
      pairwise(coordinates, (current, next, i) => {
        const latLng = { lat: next, lng: current }
        const payload = {
          latLng,
          fromPerma: true,
          permaLast: i === coordinates.length / 2 - 1,
          index: i,
        }
        processedCoords.push([latLng.lat, latLng.lng])
        if (activeTab === 0) {
          dispatch(fetchReverseGeocodePerma(payload))
        } else {
          dispatch(fetchReverseGeocodeIso(current, next))

          if ('range' in params && 'interval' in params) {
            const maxRangeName = 'maxRange'
            const intervalName = 'interval'
            const maxRangeValue = params.range
            const intervalValue = params.interval

            dispatch(
              updateIsoSettings({
                maxRangeName,
                intervalName,
                value: maxRangeValue,
              })
            )
            dispatch(
              updateIsoSettings({
                undefined,
                intervalName,
                value: intervalValue,
              })
            )
          }

          if ('denoise' in params) {
            dispatch(
              updateIsoSettings({
                denoiseName: 'denoise',
                value: params.denoise,
              })
            )
          }
          if ('generalize' in params) {
            dispatch(
              updateIsoSettings({
                generalizeName: 'generalize',
                value: params.generalize,
              })
            )
          }
        }
      })
      dispatch(zoomTo(processedCoords))
      dispatch(resetSettings())
    }
  }, [])

  useEffect(() => {
    const { message } = props
    if (!message) {
      return
    }

    const prevReceivedAt = prevMessageRef.current

    if (prevReceivedAt != null && message.receivedAt > prevReceivedAt) {
      toast[message.type](message.description, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }

    prevMessageRef.current = message.receivedAt
  }, [props.message])

  const handleTabChange = (event, data) => {
    const { dispatch } = props
    const newActiveTab = data.activeIndex

    dispatch(updateTab({ activeTab: newActiveTab }))
    dispatch(updatePermalink())
  }

  const handleDirectionsToggle = (event, data) => {
    const { dispatch } = props
    const { showDirectionsPanel } = props
    if (!showDirectionsPanel) {
      document
        .getElementsByClassName('heightgraph-container')[0]
        .setAttribute('width', window.innerWidth * 0.75)
    } else {
      document
        .getElementsByClassName('heightgraph-container')[0]
        .setAttribute('width', window.innerWidth * 0.9)
    }
    dispatch(toggleDirections())
  }

  const appPanes = [
    {
      menuItem: 'Directions',
      render: () => (
        <Tab.Pane style={{ padding: '0 0 0 0' }} attached={false}>
          <DirectionsControl />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Isochrones',
      render: () => (
        <Tab.Pane style={{ padding: '0 0 0 0' }} attached={false}>
          <IsochronesControl />
        </Tab.Pane>
      ),
    },
  ]

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
  )
}

MainControl.propTypes = {
  dispatch: PropTypes.func.isRequired,
  message: PropTypes.object,
  activeDataset: PropTypes.string,
  activeTab: PropTypes.number,
  showDirectionsPanel: PropTypes.bool,
  lastUpdate: PropTypes.object,
}

const mapStateToProps = (state) => {
  const { message, activeTab, showDirectionsPanel } = state.common
  return {
    message,
    activeTab,
    showDirectionsPanel,
  }
}

export default connect(mapStateToProps)(MainControl)
