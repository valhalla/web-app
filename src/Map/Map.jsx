import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import L from 'leaflet'
import * as $ from 'jquery'
import 'jquery-ui-bundle'
import 'jquery-ui-bundle/jquery-ui.css'

import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import 'leaflet.heightgraph'
import 'leaflet.heightgraph/dist/L.Control.Heightgraph.min.css'

import PropTypes from 'prop-types'
import axios from 'axios'

import * as R from 'ramda'
import ExtraMarkers from './extraMarkers'
import { Button, Label, Icon, Popup } from 'semantic-ui-react'
import { ToastContainer } from 'react-toastify'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import {
  fetchReverseGeocode,
  updateInclineDeclineTotal,
} from 'actions/directionsActions'
import { fetchReverseGeocodeIso } from 'actions/isochronesActions'
import { updateSettings } from 'actions/commonActions'
import {
  VALHALLA_OSM_URL,
  buildHeightRequest,
  buildLocateRequest,
} from 'utils/valhalla'
import { colorMappings, buildHeightgraphData } from 'utils/heightgraph'
import formatDuration from 'utils/date_time'
import './Map.css'
const OSMTiles = L.tileLayer(process.env.REACT_APP_TILE_SERVER_URL, {
  attribution:
    '<a href="https://map.project-osrm.org/about.html" target="_blank">About this service and privacy policy</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
})
import distMarkers from 'utils/distMarkers'

const convertDDToDMS = (decimalDegrees) =>
  [
    0 | decimalDegrees,
    '° ',
    0 |
      (((decimalDegrees =
        (decimalDegrees < 0 ? -decimalDegrees : decimalDegrees) + 1e-4) %
        1) *
        60),
    "' ",
    0 | (((decimalDegrees * 60) % 1) * 60),
    '"',
  ].join('')

// for this app we create two leaflet layer groups to control, one for the isochrone centers and one for the isochrone contours
const isoCenterLayer = L.featureGroup()
const isoPolygonLayer = L.featureGroup()
const isoLocationsLayer = L.featureGroup()
const routeMarkersLayer = L.featureGroup()
const routeLineStringLayer = L.featureGroup()
const highlightRouteSegmentlayer = L.featureGroup()
const highlightRouteIndexLayer = L.featureGroup()
const excludePolygonsLayer = L.featureGroup()

const centerCoords = process.env.REACT_APP_CENTER_COORDS.split(',')
let center = [parseFloat(centerCoords[0]), parseFloat(centerCoords[1])]
let zoom_initial = 10

if (localStorage.getItem('last_center')) {
  const last_center = JSON.parse(localStorage.getItem('last_center'))
  center = last_center.center
  zoom_initial = last_center.zoom_level
}

const maxBoundsString = process.env.REACT_APP_MAX_BOUNDS?.split(',')
const maxBounds = maxBoundsString
  ? [
      //south west corner
      [parseFloat(maxBoundsString[0]), parseFloat(maxBoundsString[1])],
      //north east corner
      [parseFloat(maxBoundsString[2]), parseFloat(maxBoundsString[3])],
    ]
  : undefined

// a leaflet map consumes parameters, I'd say they are quite self-explanatory
const mapParams = {
  center,
  maxBounds,
  maxBoundsViscosity: 1.0,
  zoomControl: false,
  zoom: zoom_initial,
  maxZoom: 18,
  minZoom: 2,
  worldCopyJump: true,
  layers: [
    isoCenterLayer,
    routeMarkersLayer,
    isoPolygonLayer,
    isoLocationsLayer,
    routeLineStringLayer,
    highlightRouteSegmentlayer,
    highlightRouteIndexLayer,
    excludePolygonsLayer,
    OSMTiles,
  ],
}

const routeObjects = {
  [VALHALLA_OSM_URL]: {
    color: '#0066ff',
    alternativeColor: '#66a3ff',
    name: 'OSM',
  },
}

// this you have seen before, we define a react component
class Map extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    directions: PropTypes.object,
    isochrones: PropTypes.object,
    profile: PropTypes.string,
    activeTab: PropTypes.number,
    activeDataset: PropTypes.string,
    showRestrictions: PropTypes.object,
    coordinates: PropTypes.array,
    showDirectionsPanel: PropTypes.bool,
    showSettings: PropTypes.bool,
  }

  constructor(props) {
    super(props)
    this.layerControl = null
    this.state = {
      showPopup: false,
      isLocateLoading: false,
      isHeightLoading: false,
      locate: [],
    }
  }

  // and once the component has mounted we add everything to it
  componentDidMount() {
    // our map!
    //const { dispatch } = this.props

    this.map = L.map('map', mapParams)

    // we create a leaflet pane which will hold all isochrone polygons with a given opacity
    const isochronesPane = this.map.createPane('isochronesPane')
    isochronesPane.style.opacity = 0.9

    // our basemap and add it to the map
    const baseMaps = {
      OpenStreetMap: OSMTiles,
    }

    const overlayMaps = {
      Waypoints: routeMarkersLayer,
      'Isochrone Center': isoCenterLayer,
      Routes: routeLineStringLayer,
      Isochrones: isoPolygonLayer,
      'Isochrones (locations)': isoLocationsLayer,
    }

    this.layerControl = L.control.layers(baseMaps, overlayMaps).addTo(this.map)

    // we do want a zoom control
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(this.map)

    //and for the sake of advertising your company, you may add a logo to the map
    const brand = L.control({
      position: 'bottomleft',
    })
    brand.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'brand')
      div.innerHTML =
        '<a href="https://fossgis.de/news/2021-11-12_funding_valhalla/" target="_blank"><div class="fossgis-logo"></div></a>'
      return div
    }

    this.map.addControl(brand)

    const valhallaBrand = L.control({
      position: 'bottomleft',
    })
    valhallaBrand.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'brand')
      div.innerHTML =
        '<a href="https://github.com/valhalla/valhalla" target="_blank"><div class="valhalla-logo"></div></a>'
      return div
    }

    this.map.addControl(valhallaBrand)

    const popup = L.popup({ className: 'valhalla-popup' })

    this.map.on('popupclose', (event) => {
      this.setState({ hasCopied: false, locate: [] })
    })
    this.map.on('contextmenu', (event) => {
      popup.setLatLng(event.latlng).openOn(this.map)

      setTimeout(() => {
        // as setContent needs the react dom we are setting the state here
        // to showPopup which then again renders a react portal in the render
        // return function..
        this.setState({
          showPopup: true,
          showInfoPopup: false,
          latLng: event.latlng,
        })

        popup.update()
      }, 20) //eslint-disable-line
    })

    this.map.on('click', (event) => {
      if (
        !this.map.pm.globalRemovalEnabled() &&
        !this.map.pm.globalDrawModeEnabled()
      ) {
        popup.setLatLng(event.latlng).openOn(this.map)

        this.getHeight(event.latlng)

        setTimeout(() => {
          this.setState({
            showPopup: true,
            showInfoPopup: true,
            latLng: event.latlng,
          })
          popup.update()
        }, 20) //eslint-disable-line
      }
    })

    this.map.on('moveend', () => {
      const last_coords = this.map.getCenter()
      const zoom_level = this.map.getZoom()

      const last_center = JSON.stringify({
        center: [last_coords.lat, last_coords.lng],
        zoom_level: zoom_level,
      })
      localStorage.setItem('last_center', last_center)
    })

    // add Leaflet-Geoman controls with some options to the map
    this.map.pm.addControls({
      position: 'topright',
      drawCircle: false,
      drawMarker: false,
      drawPolyline: false,
      cutPolygon: false,
      drawCircleMarker: false,
      drawRectangle: false,
      dragMode: true,
      allowSelfIntersection: false,
      editPolygon: true,
      deleteLayer: true,
    })

    this.map.pm.setGlobalOptions({
      layerGroup: excludePolygonsLayer,
    })

    this.map.on('pm:create', ({ layer }) => {
      layer.on('pm:edit', (e) => {
        this.updateExcludePolygons()
      })
      layer.on('pm:dragend', (e) => {
        this.updateExcludePolygons()
      })
      this.updateExcludePolygons()
    })

    this.map.on('pm:remove', (e) => {
      this.updateExcludePolygons()
    })

    const getHeightData = this.getHeightData
    const { showDirectionsPanel } = this.props
    this.hg = L.control.heightgraph({
      mappings: colorMappings,
      graphStyle: {
        opacity: 0.9,
        'fill-opacity': 1,
        'stroke-width': '0px',
      },
      translation: {
        distance: 'Distance from start',
      },
      expandCallback(expand) {
        if (expand) {
          getHeightData()
        }
      },
      expandControls: true,
      expand: false,
      highlightStyle: {
        color: 'blue',
      },
      width: showDirectionsPanel
        ? window.innerWidth * 0.75
        : window.innerWidth * 0.9,
    })
    this.hg.addTo(this.map)
    const hg = this.hg
    // Added title property to heightgraph-toggle element to show "Height Graph" tooltip
    $('.heightgraph-toggle').prop('title', 'Height Graph')
    $('.heightgraph').resizable({
      handles: 'w, n, nw',
      minWidth: 380,
      minHeight: 140,
      stop: function (event, ui) {
        // Remove the size/position of the UI element (.heightgraph .leaflet-control) because
        // it should be sized dynamically based on its contents. Giving it a fixed size causes
        // the toggle icon to be in the wrong place when the height graph is minimized.
        ui.element.css({ width: '', height: '', left: '', top: '' })
      },
      resize: function (event, ui) {
        if (
          ui.originalPosition.left !== ui.position.left ||
          ui.originalPosition.top !== ui.position.top
        ) {
          // left/upper edge was dragged => only keep size change since we're sticking to the right/bottom
          ui.position.left = 0
          ui.position.top = 0
        }
        hg.resize(ui.size)
      },
    })

    // this.map.on('moveend', () => {
    //   dispatch(doUpdateBoundingBox(this.map.getBounds()))
    // })
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      // we want to make sure only the addresses are compared

      !R.equals(
        this.props.directions.selectedAddresses,
        nextProps.directions.selectedAddresses
      ) ||
      !R.equals(
        this.props.isochrones.selectedAddress,
        nextProps.isochrones.selectedAddress
      )
    ) {
      return true
    }

    if (this.state.showPopup || nextState.showPopup) {
      return true
    }

    if (this.props.directions.successful !== nextProps.directions.successful) {
      return true
    }

    if (this.props.isochrones.successful !== nextProps.isochrones.successful) {
      return true
    }

    if (
      !R.equals(this.props.directions.results, nextProps.directions.results)
    ) {
      return true
    }

    if (
      !R.equals(
        this.props.directions.highlightSegment,
        nextProps.directions.highlightSegment
      )
    ) {
      return true
    }

    if (
      !R.equals(this.props.directions.zoomObj, nextProps.directions.zoomObj)
    ) {
      return true
    }

    if (
      !R.equals(this.props.isochrones.results, nextProps.isochrones.results)
    ) {
      return true
    }

    if (!R.equals(this.props.showRestrictions, nextProps.showRestrictions)) {
      return true
    }

    if (!R.equals(this.props.coordinates, nextProps.coordinates)) {
      return true
    }

    if (this.props.activeDataset !== nextProps.activeDataset) {
      return true
    }

    return false
  }

  componentDidUpdate = (prevProps, prevState) => {
    this.addWaypoints()
    this.addIsoCenter()
    this.addIsochrones()

    if (!R.equals(this.props.coordinates, prevProps.coordinates)) {
      //      this.zoomToCoordinates()
    }
    if (
      prevProps.directions.zoomObj.timeNow <
      this.props.directions.zoomObj.timeNow
    ) {
      this.zoomTo(this.props.directions.zoomObj.index)
    }

    this.addRoutes()
    this.handleHighlightSegment()

    const { directions, isochrones } = this.props

    if (!directions.successful) {
      routeLineStringLayer.clearLayers()
    }
    if (!isochrones.successful) {
      isoPolygonLayer.clearLayers()
      isoLocationsLayer.clearLayers()
    }
  }

  zoomToCoordinates = () => {
    const { coordinates, showDirectionsPanel, showSettings } = this.props
    const maxZoom = coordinates.length === 1 ? 11 : 18
    const paddingTopLeft = [
      screen.width < 550 ? 50 : showDirectionsPanel ? 420 : 50,
      50,
    ]

    const paddingBottomRight = [
      screen.width < 550 ? 50 : showSettings ? 420 : 50,
      50,
    ]

    this.map.fitBounds(coordinates, {
      paddingBottomRight,
      paddingTopLeft,
      maxZoom,
    })
  }

  zoomTo = (idx) => {
    const { results } = this.props.directions

    const coords = results[VALHALLA_OSM_URL].data.decodedGeometry

    this.map.setView(coords[idx], 17)

    const highlightMarker = ExtraMarkers.icon({
      icon: 'fa-coffee',
      markerColor: 'blue',
      shape: 'circle',
      prefix: 'fa',
      iconColor: 'white',
    })

    L.marker(coords[idx], {
      icon: highlightMarker,
      pmIgnore: true,
    }).addTo(highlightRouteIndexLayer)

    setTimeout(() => {
      highlightRouteIndexLayer.clearLayers()
    }, 1000)
  }

  getIsoTooltip = (contour, area, provider) => {
    return `
    <div class="ui list">
        <div class="item">
        <div class="header">
            Isochrone Summary
        </div>
        </div>
        <div class="item">
          <i class="time icon"></i>
          <div class="content">
            ${contour} mins
          </div>
        </div>
        <div class="item">
          <i class="arrows alternate icon"></i>
          <div class="content">
            ${area} km2
          </div>
        </div>
      </div>
    `
  }

  getIsoLocationTooltip = () => {
    return `
    <div class="ui list">
        <div class="item">
          Snapped location
        </div>
      </div>
    `
  }

  handleHighlightSegment = () => {
    const { highlightSegment, results } = this.props.directions

    const { startIndex, endIndex, alternate } = highlightSegment

    let coords
    if (alternate == -1) {
      coords = results[VALHALLA_OSM_URL].data.decodedGeometry
    } else {
      coords =
        results[VALHALLA_OSM_URL].data.alternates[alternate].decodedGeometry
    }

    if (startIndex > -1 && endIndex > -1) {
      L.polyline(coords.slice(startIndex, endIndex + 1), {
        color: 'yellow',
        weight: 4,
        opacity: 1,
        pmIgnore: true,
      }).addTo(highlightRouteSegmentlayer)
    } else {
      highlightRouteSegmentlayer.clearLayers()
    }
  }

  handleCopy = () => {
    this.setState({ hasCopied: true })
    setTimeout(() => {
      this.setState({ hasCopied: false })
    }, 1000)
  }

  addIsochrones = () => {
    const { results } = this.props.isochrones
    isoPolygonLayer.clearLayers()
    isoLocationsLayer.clearLayers()

    for (const provider of [VALHALLA_OSM_URL]) {
      if (
        Object.keys(results[provider].data).length > 0 &&
        results[provider].show
      ) {
        for (const feature of results[provider].data.features) {
          const coords_reversed = []
          for (const latLng of feature.geometry.coordinates) {
            coords_reversed.push([latLng[1], latLng[0]])
          }
          if (['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
            L.geoJSON(feature, {
              style: (feat) => ({
                ...feat.properties,
                color: '#fff',
                opacity: 1,
              }),
            })
              .bindTooltip(
                this.getIsoTooltip(
                  feature.properties.contour,
                  feature.properties.area.toFixed(2),
                  provider
                ),
                {
                  permanent: false,
                  sticky: true,
                }
              )
              .addTo(isoPolygonLayer)
          } else {
            // locations

            if (feature.properties.type === 'input') {
              return
            }
            L.geoJSON(feature, {
              pointToLayer: (feat, ll) => {
                return L.circleMarker(ll, {
                  radius: 6,
                  color: '#000',
                  fillColor: '#fff',
                  fill: true,
                  fillOpacity: 1,
                }).bindTooltip(this.getIsoLocationTooltip(), {
                  permanent: false,
                  sticky: true,
                })
              },
            }).addTo(isoLocationsLayer)
          }
        }
      }
    }
  }

  getRouteToolTip = (summary, provider) => {
    return `
    <div class="ui list">
        <div class="item">
          <div class="header">
              Route Summary
          </div>
        </div>
        <div class="item">
          <i class="arrows alternate horizontal icon"></i>
          <div class="content">
            ${summary.length.toFixed(summary.length > 1000 ? 0 : 1)} km
          </div>
        </div>
        <div class="item">
          <i class="time icon"></i>
          <div class="content">
            ${formatDuration(summary.time)}
          </div>
        </div>
      </div>
    `
  }

  /*
  addDistMarkers = (coords)=>{
    distMarkerLayer.clearLayers()
    let totalDist=0.0
    let distmarkersegs=[]
    let distmarkerSegIdx=0;
    let markerDist=1000;
    for (let i = 0; i < coords.length - 1; i++) {
      const start = coords[i]
      const end = coords[i + 1]
      let segDist=start.distanceTo(end)
      if (totalDist+segDist>markerDist){
        distmarkersegs[distmarkerSegIdx]={coodIdx:i,dist:totalDist+markerDist}


      }

    }

    for (const coord of coords) {
      L.marker(coord, {
        icon: ExtraMarkers.icon({
          icon: 'fa-number',
          markerColor: 'blue',
          shape: 'circle',
          prefix: 'fa',
          number: '1',
        }),
      }).addTo(distMarkerLayer)
    }
  }
  */

  addDistMarkers = (distmarkers) => {
    for (let index = 0; index < distmarkers.length; index++) {
      const wpMarker = ExtraMarkers.icon({
        icon: 'fa-number',
        markerColor: '#FFBF00',
        //shape: 'star',
        prefix: 'fa',
        number: (index + 1).toString(),
        svg: true,
        shape: 'square',
        iconSize: [25, 45],
        iconColor: 'black',
      })
      const crds = distmarkers[index].geometry.coordinates
      L.marker([crds[1], crds[0]], {
        icon: wpMarker,
        draggable: false,
        index: index,
        pmIgnore: true,
      }).addTo(routeMarkersLayer)
    }
  }

  addRoutes = () => {
    const { results } = this.props.directions
    routeLineStringLayer.clearLayers()

    if (Object.keys(results[VALHALLA_OSM_URL].data).length > 0) {
      const response = results[VALHALLA_OSM_URL].data
      // show alternates if they exist on the respsonse
      if (response.alternates) {
        for (let i = 0; i < response.alternates.length; i++) {
          if (!results[VALHALLA_OSM_URL].show[i]) {
            continue
          }
          const alternate = response.alternates[i]
          const coords = alternate.decodedGeometry
          const summary = alternate.trip.summary
          L.polyline(coords, {
            color: '#FFF',
            weight: 9,
            opacity: 1,
            pmIgnore: true,
          }).addTo(routeLineStringLayer)
          L.polyline(coords, {
            color: routeObjects[VALHALLA_OSM_URL].alternativeColor,
            weight: 5,
            opacity: 1,
            pmIgnore: true,
          })
            .addTo(routeLineStringLayer)
            .bindTooltip(this.getRouteToolTip(summary, VALHALLA_OSM_URL), {
              permanent: false,
              sticky: true,
            })
        }
      }
      if (!results[VALHALLA_OSM_URL].show[-1]) {
        return
      }
      const coords = response.decodedGeometry
      const dist = distMarkers(coords)
      this.addDistMarkers(dist)
      const summary = response.trip.summary
      L.polyline(coords, {
        color: '#FFF',
        weight: 9,
        opacity: 1,
        pmIgnore: true,
      }).addTo(routeLineStringLayer)
      L.polyline(coords, {
        color: routeObjects[VALHALLA_OSM_URL].color,
        weight: 5,
        opacity: 1,
        pmIgnore: true,
      })
        .addTo(routeLineStringLayer)
        .bindTooltip(this.getRouteToolTip(summary, VALHALLA_OSM_URL), {
          permanent: false,
          sticky: true,
        })

      if (this.hg._showState === true) {
        this.hg._expand()
      }
    }
  }

  handleAddWaypoint = (data, e) => {
    this.map.closePopup()
    this.updateWaypointPosition({
      latLng: this.state.latLng,
      index: e.index,
    })
  }

  handleAddIsoWaypoint = (data, e) => {
    this.map.closePopup()
    const { latLng } = this.state
    this.updateIsoPosition(latLng)
  }

  updateExcludePolygons() {
    const excludePolygons = []
    excludePolygonsLayer.eachLayer((layer) => {
      const lngLatArray = []
      for (const coords of layer._latlngs[0]) {
        lngLatArray.push([coords.lng, coords.lat])
      }
      excludePolygons.push(lngLatArray)
    })
    const { dispatch } = this.props
    const name = 'exclude_polygons'
    const value = excludePolygons
    dispatch(
      updateSettings({
        name,
        value,
      })
    )
  }

  updateWaypointPosition(object) {
    const { dispatch } = this.props
    dispatch(fetchReverseGeocode(object))
  }

  updateIsoPosition(coord) {
    const { dispatch } = this.props
    dispatch(fetchReverseGeocodeIso(coord.lng, coord.lat))
  }

  addIsoCenter = () => {
    isoCenterLayer.clearLayers()
    const { geocodeResults } = this.props.isochrones
    for (const address of geocodeResults) {
      if (address.selected) {
        const isoMarker = ExtraMarkers.icon({
          icon: 'fa-number',
          markerColor: 'purple',
          shape: 'star',
          prefix: 'fa',
          number: '1',
        })

        L.marker([address.displaylnglat[1], address.displaylnglat[0]], {
          icon: isoMarker,
          draggable: true,
          pmIgnore: true,
        })
          .addTo(isoCenterLayer)
          .bindTooltip(address.title, { permanent: false })
          //.openTooltip()
          .on('dragend', (e) => {
            this.updateIsoPosition(e.target.getLatLng())
          })
      }
    }
  }

  getLocate(latlng) {
    const { profile } = this.props
    this.setState({ isLocateLoading: true })
    axios
      .post(VALHALLA_OSM_URL + '/locate', buildLocateRequest(latlng, profile), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(({ data }) => {
        this.setState({ locate: data, isLocateLoading: false })
      })
      .catch(({ response }) => {
        console.log(response) //eslint-disable-line
      })
  }

  getHeightData = () => {
    const { results } = this.props.directions
    const { dispatch } = this.props

    const heightPayload = buildHeightRequest(
      results[VALHALLA_OSM_URL].data.decodedGeometry
    )

    if (!R.equals(this.state.heightPayload, heightPayload)) {
      this.hg._removeChart()
      this.setState({ isHeightLoading: true, heightPayload })
      axios
        .post(VALHALLA_OSM_URL + '/height', heightPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(({ data }) => {
          this.setState({ isHeightLoading: false })
          // lets build geojson object with steepness for the height graph
          const reversedGeometry = JSON.parse(
            JSON.stringify(results[VALHALLA_OSM_URL].data.decodedGeometry)
          ).map((pair) => {
            return [...pair.reverse()]
          })
          const heightData = buildHeightgraphData(
            reversedGeometry,
            data.range_height
          )
          const { inclineTotal, declineTotal } = heightData[0].properties
          dispatch(
            updateInclineDeclineTotal({
              inclineTotal,
              declineTotal,
            })
          )

          this.hg.addData(heightData)
        })
        .catch(({ response }) => {
          console.log(response) //eslint-disable-line
        })
    }
  }

  getHeight(latLng) {
    this.setState({ isHeightLoading: true })
    axios
      .post(
        VALHALLA_OSM_URL + '/height',
        buildHeightRequest([[latLng.lat, latLng.lng]]),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(({ data }) => {
        if ('height' in data) {
          this.setState({
            elevation: data.height[0] + ' m',
            isHeightLoading: false,
          })
        }
      })
      .catch(({ response }) => {
        console.log(response) //eslint-disable-line
      })
  }

  addWaypoints() {
    routeMarkersLayer.clearLayers()
    const { waypoints } = this.props.directions
    let index = 0
    for (const waypoint of waypoints) {
      for (const address of waypoint.geocodeResults) {
        if (address.selected) {
          const wpMarker = ExtraMarkers.icon({
            icon: 'fa-number',
            markerColor: 'green',
            //shape: 'star',
            prefix: 'fa',
            number: (index + 1).toString(),
          })

          L.marker([address.displaylnglat[1], address.displaylnglat[0]], {
            icon: wpMarker,
            draggable: true,
            index: index,
            pmIgnore: true,
          })
            .addTo(routeMarkersLayer)
            .bindTooltip(address.title, {
              permanent: false,
            })
            //.openTooltip()
            .on('dragend', (e) => {
              this.updateWaypointPosition({
                latLng: e.target.getLatLng(),
                index: e.target.options.index,
                fromDrag: true,
              })
            })
        }
      }
      index += 1
    }
  }

  handleOpenOSM = () => {
    const { map } = this
    const { lat, lng } = map.getCenter()
    const zoom = map.getZoom()
    const osmURL = `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`
    window.open(osmURL, '_blank')
  }

  render() {
    const { activeTab } = this.props
    const MapPopup = (isInfo) => {
      return (
        <React.Fragment>
          {isInfo ? (
            <React.Fragment>
              <div>
                <Button.Group basic size="tiny">
                  <Popup
                    size="tiny"
                    content="Longitude, Latitude"
                    trigger={
                      <Button
                        compact
                        content={
                          this.state.latLng.lng.toFixed(6) +
                          ', ' +
                          this.state.latLng.lat.toFixed(6)
                        }
                      />
                    }
                  />
                  <CopyToClipboard
                    text={
                      this.state.latLng.lng.toFixed(6) +
                      ',' +
                      this.state.latLng.lat.toFixed(6)
                    }
                    onCopy={this.handleCopy}
                  >
                    <Button compact icon="copy" />
                  </CopyToClipboard>
                </Button.Group>
              </div>

              <div className="mt1 flex">
                <Button.Group basic size="tiny">
                  <Popup
                    size="tiny"
                    content="Latitude, Longitude"
                    trigger={
                      <Button
                        compact
                        content={
                          this.state.latLng.lat.toFixed(6) +
                          ', ' +
                          this.state.latLng.lng.toFixed(6)
                        }
                      />
                    }
                  />
                  <CopyToClipboard
                    text={
                      this.state.latLng.lat.toFixed(6) +
                      ',' +
                      this.state.latLng.lng.toFixed(6)
                    }
                    onCopy={this.handleCopy}
                  >
                    <Button compact icon="copy" />
                  </CopyToClipboard>
                </Button.Group>
              </div>
              <div className="mt1 flex">
                <Button.Group basic size="tiny">
                  <Popup
                    size="tiny"
                    content="Latitude, Longitude"
                    trigger={
                      <Button
                        compact
                        content={
                          convertDDToDMS(this.state.latLng.lat) +
                          ' N ' +
                          convertDDToDMS(this.state.latLng.lng) +
                          ' E'
                        }
                      />
                    }
                  />
                  <CopyToClipboard
                    text={
                      convertDDToDMS(this.state.latLng.lat) +
                      ' N ' +
                      convertDDToDMS(this.state.latLng.lng) +
                      ' E'
                    }
                    onCopy={this.handleCopy}
                  >
                    <Button compact icon="copy" />
                  </CopyToClipboard>
                </Button.Group>
              </div>

              <div className="mt1">
                <Button.Group basic size="tiny">
                  <Popup
                    size="tiny"
                    content="Calls Valhalla's Locate API"
                    trigger={
                      <Button
                        onClick={() => this.getLocate(this.state.latLng)}
                        compact
                        loading={this.state.isLocateLoading}
                        icon="cogs"
                        content="Locate Point"
                      />
                    }
                  />
                  <CopyToClipboard
                    text={JSON.stringify(this.state.locate)}
                    onCopy={this.handleCopy}
                  >
                    <Button
                      disabled={this.state.locate.length === 0}
                      compact
                      icon="copy"
                    />
                  </CopyToClipboard>
                </Button.Group>
              </div>
              <div className="mt1">
                <Button.Group basic size="tiny">
                  <Popup
                    size="tiny"
                    content="Copies a Valhalla location object to clipboard which you can use for your API requests"
                    trigger={
                      <Button
                        compact
                        icon="map marker alternate"
                        content="Valhalla Location JSON"
                      />
                    }
                  />
                  <CopyToClipboard
                    text={`{
                        "lon": ${this.state.latLng.lng.toFixed(6)},
                        "lat": ${this.state.latLng.lat.toFixed(6)}
                      }`}
                    onCopy={this.handleCopy}
                  >
                    <Button compact icon="copy" />
                  </CopyToClipboard>
                </Button.Group>
              </div>
              <div className="mt1 flex justify-between">
                <Popup
                  size="tiny"
                  content="Elevation at this point"
                  trigger={
                    <Button
                      basic
                      compact
                      size="tiny"
                      loading={this.state.isHeightLoading}
                      icon="resize vertical"
                      content={this.state.elevation}
                    />
                  }
                />

                <div>
                  {this.state.hasCopied && (
                    <Label size="mini" basic color="green">
                      <Icon name="checkmark" /> copied
                    </Label>
                  )}
                </div>
              </div>
            </React.Fragment>
          ) : activeTab === 0 ? (
            <React.Fragment>
              <Button.Group size="small" basic vertical>
                <Button compact index={0} onClick={this.handleAddWaypoint}>
                  Directions from here
                </Button>
                <Button compact index={1} onClick={this.handleAddWaypoint}>
                  Add as via point
                </Button>
                <Button compact index={-1} onClick={this.handleAddWaypoint}>
                  Directions to here
                </Button>
              </Button.Group>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button.Group size="small" basic vertical>
                <Button index={0} onClick={this.handleAddIsoWaypoint}>
                  Set center here
                </Button>
              </Button.Group>
            </React.Fragment>
          )}
        </React.Fragment>
      )
    }

    const leafletPopupDiv = document.querySelector('.leaflet-popup-content')
    return (
      <React.Fragment>
        <div>
          <ToastContainer
            position="bottom-center"
            autoClose={5000}
            limit={1}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <div id="map" className="map-style" />
          <button
            className="ui primary button"
            id="osm-button"
            onClick={this.handleOpenOSM}
          >
            Open OSM
          </button>
        </div>
        <div>
          {this.state.showPopup && leafletPopupDiv
            ? ReactDOM.createPortal(
                MapPopup(this.state.showInfoPopup),
                leafletPopupDiv
              )
            : null}
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state) => {
  const { directions, isochrones, common } = state
  const {
    activeTab,
    profile,
    showRestrictions,
    activeDataset,
    coordinates,
    showDirectionsPanel,
    showSettings,
  } = common
  return {
    directions,
    isochrones,
    profile,
    coordinates,
    activeTab,
    activeDataset,
    showRestrictions,
    showDirectionsPanel,
    showSettings,
  }
}

export default connect(mapStateToProps)(Map)
