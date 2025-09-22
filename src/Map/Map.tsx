import React, { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import L from 'leaflet'

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
import makeResizable from 'utils/resizable'
import './Map.css'
const OSMTiles = L.tileLayer(process.env.REACT_APP_TILE_SERVER_URL, {
  attribution:
    '<a href="https://map.project-osrm.org/about.html" target="_blank">About this service and privacy policy</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
})

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
const Map = ({
  dispatch,
  directions,
  isochrones,
  profile,
  activeTab,
  activeDataset,
  showRestrictions,
  coordinates,
  showDirectionsPanel,
  showSettings,
}) => {
  const [showPopup, setShowPopup] = useState(false)
  const [isLocateLoading, setIsLocateLoading] = useState(false)
  const [isHeightLoading, setIsHeightLoading] = useState(false)
  const [locate, setLocate] = useState([])
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [latLng, setLatLng] = useState(null)
  const [hasCopied, setHasCopied] = useState(false)
  const [elevation, setElevation] = useState('')
  const [heightPayload, setHeightPayload] = useState(null)

  const mapRef = useRef(null)
  const layerControlRef = useRef(null)
  const hgRef = useRef(null)
  const heightgraphResizerRef = useRef(null)

  const updateExcludePolygons = useCallback(() => {
    const excludePolygons = []
    excludePolygonsLayer.eachLayer((layer) => {
      const lngLatArray = []
      for (const coords of layer._latlngs[0]) {
        lngLatArray.push([coords.lng, coords.lat])
      }
      excludePolygons.push(lngLatArray)
    })
    const name = 'exclude_polygons'
    const value = excludePolygons
    dispatch(
      updateSettings({
        name,
        value,
      })
    )
  }, [])

  const updateWaypointPosition = useCallback((object) => {
    dispatch(fetchReverseGeocode(object))
  }, [])

  const updateIsoPosition = useCallback((coord) => {
    dispatch(fetchReverseGeocodeIso(coord.lng, coord.lat))
  }, [])

  const handleCopy = useCallback(() => {
    setHasCopied(true)
    setTimeout(() => {
      setHasCopied(false)
    }, 1000)
  }, [])

  const handleOpenOSM = useCallback(() => {
    const { lat, lng } = mapRef.current.getCenter()
    const zoom = mapRef.current.getZoom()
    const osmURL = `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`
    window.open(osmURL, '_blank')
  }, [])

  const getHeight = useCallback((position) => {
    setIsHeightLoading(true)
    axios
      .post(
        VALHALLA_OSM_URL + '/height',
        buildHeightRequest([[position.lat, position.lng]]),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(({ data }) => {
        if ('height' in data) {
          setElevation(data.height[0] + ' m')
        }
      })
      .catch(({ response }) => {
        console.log(response) //eslint-disable-line
      })
      .finally(() => {
        setIsHeightLoading(false)
      })
  }, [])

  const getLocate = useCallback(
    (position) => {
      setIsLocateLoading(true)
      axios
        .post(
          VALHALLA_OSM_URL + '/locate',
          buildLocateRequest(position, profile),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then(({ data }) => {
          setLocate(data)
        })
        .catch(({ response }) => {
          console.log(response) //eslint-disable-line
        })
        .finally(() => {
          setIsLocateLoading(false)
        })
    },
    [profile]
  )

  const handleAddWaypoint = useCallback(
    (data, e) => {
      mapRef.current.closePopup()
      updateWaypointPosition({
        latLng: latLng,
        index: e.index,
      })
    },
    [latLng, updateWaypointPosition]
  )

  const handleAddIsoWaypoint = useCallback(
    (data, e) => {
      mapRef.current.closePopup()
      updateIsoPosition(latLng)
    },
    [latLng, updateIsoPosition]
  )

  const getHeightData = useCallback(() => {
    const { results } = directions

    const heightPayloadNew = buildHeightRequest(
      results[VALHALLA_OSM_URL].data.decodedGeometry
    )

    if (!R.equals(heightPayload, heightPayloadNew)) {
      if (hgRef.current && hgRef.current._removeChart) {
        hgRef.current._removeChart()
      }
      setIsHeightLoading(true)
      setHeightPayload(heightPayloadNew)
      axios
        .post(VALHALLA_OSM_URL + '/height', heightPayloadNew, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(({ data }) => {
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

          if (hgRef.current) {
            hgRef.current.addData(heightData)
          }
        })
        .catch(({ response }) => {
          console.log(response) //eslint-disable-line
        })
        .finally(() => {
          setIsHeightLoading(false)
        })
    }
  }, [directions, heightPayload, dispatch])

  // Map initialization effect
  useEffect(() => {
    // our map!
    mapRef.current = L.map('map', mapParams)

    // we create a leaflet pane which will hold all isochrone polygons with a given opacity
    const isochronesPane = mapRef.current.createPane('isochronesPane')
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

    layerControlRef.current = L.control
      .layers(baseMaps, overlayMaps)
      .addTo(mapRef.current)

    // we do want a zoom control
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(mapRef.current)

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

    mapRef.current.addControl(brand)

    const valhallaBrand = L.control({
      position: 'bottomleft',
    })
    valhallaBrand.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'brand')
      div.innerHTML =
        '<a href="https://github.com/valhalla/valhalla" target="_blank"><div class="valhalla-logo"></div></a>'
      return div
    }

    mapRef.current.addControl(valhallaBrand)

    const popup = L.popup({ className: 'valhalla-popup' })

    mapRef.current.on('popupclose', (event) => {
      setHasCopied(false)
      setLocate([])
    })
    mapRef.current.on('contextmenu', (event) => {
      popup.setLatLng(event.latlng).openOn(mapRef.current)

      setTimeout(() => {
        // as setContent needs the react dom we are setting the state here
        // to showPopup which then again renders a react portal in the render
        // return function..
        setShowPopup(true)
        setShowInfoPopup(false)
        setLatLng(event.latlng)

        popup.update()
      }, 20) //eslint-disable-line
    })

    mapRef.current.on('click', (event) => {
      if (
        !mapRef.current.pm.globalRemovalEnabled() &&
        !mapRef.current.pm.globalDrawModeEnabled()
      ) {
        popup.setLatLng(event.latlng).openOn(mapRef.current)

        getHeight(event.latlng)

        setTimeout(() => {
          setShowPopup(true)
          setShowInfoPopup(true)
          setLatLng(event.latlng)
          popup.update()
        }, 20) //eslint-disable-line
      }
    })

    mapRef.current.on('moveend', () => {
      const last_coords = mapRef.current.getCenter()
      const zoom_level = mapRef.current.getZoom()

      const last_center = JSON.stringify({
        center: [last_coords.lat, last_coords.lng],
        zoom_level: zoom_level,
      })
      localStorage.setItem('last_center', last_center)
    })

    // add Leaflet-Geoman controls with some options to the map
    mapRef.current.pm.addControls({
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

    mapRef.current.pm.setGlobalOptions({
      layerGroup: excludePolygonsLayer,
    })

    mapRef.current.on('pm:create', ({ layer }) => {
      layer.on('pm:edit', (e) => {
        updateExcludePolygons()
      })
      layer.on('pm:dragend', (e) => {
        updateExcludePolygons()
      })
      updateExcludePolygons()
    })

    mapRef.current.on('pm:remove', (e) => {
      updateExcludePolygons()
    })

    hgRef.current = L.control.heightgraph({
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
    hgRef.current.addTo(mapRef.current)
    const hg = hgRef.current
    // Added title property to heightgraph-toggle element to show "Height Graph" tooltip
    document
      .querySelector('.heightgraph-toggle')
      .setAttribute('title', 'Height Graph')

    const heightgraphEl = document.querySelector('.heightgraph')
    if (heightgraphEl) {
      heightgraphResizerRef.current = makeResizable(heightgraphEl, {
        handles: 'w, n, nw',
        minWidth: 380,
        minHeight: 140,
        applyInlineSize: false,
        onResize: ({ width, height }) => {
          hg.resize({ width, height })
        },
        onStop: () => {
          // Clear inline size/position if any
          heightgraphEl.style.width = ''
          heightgraphEl.style.height = ''
          heightgraphEl.style.left = ''
          heightgraphEl.style.top = ''
        },
      })
    }

    // Cleanup function
    return () => {
      if (
        heightgraphResizerRef.current &&
        typeof heightgraphResizerRef.current.destroy === 'function'
      ) {
        heightgraphResizerRef.current.destroy()
      }
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [])

  // Map update functions
  const zoomToCoordinates = useCallback(() => {
    const maxZoom = coordinates.length === 1 ? 11 : 18
    const paddingTopLeft = [
      screen.width < 550 ? 50 : showDirectionsPanel ? 420 : 50,
      50,
    ]

    const paddingBottomRight = [
      screen.width < 550 ? 50 : showSettings ? 420 : 50,
      50,
    ]

    mapRef.current.fitBounds(coordinates, {
      paddingBottomRight,
      paddingTopLeft,
      maxZoom,
    })
  }, [coordinates, showDirectionsPanel, showSettings])

  const zoomTo = useCallback(
    (idx) => {
      const { results } = directions

      if (
        !results[VALHALLA_OSM_URL] ||
        !results[VALHALLA_OSM_URL].data ||
        !results[VALHALLA_OSM_URL].data.decodedGeometry
      ) {
        return
      }

      const coords = results[VALHALLA_OSM_URL].data.decodedGeometry

      if (!mapRef.current || !coords[idx]) {
        return
      }

      mapRef.current.setView(coords[idx], 17)

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
    },
    [directions]
  )

  const getIsoTooltip = useCallback((contour, area, provider) => {
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
  }, [])

  const getIsoLocationTooltip = useCallback(() => {
    return `
    <div class="ui list">
        <div class="item">
          Snapped location
        </div>
      </div>
    `
  }, [])

  const getRouteToolTip = useCallback((summary, provider) => {
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
  }, [])

  // Handle map layers updates
  const handleHighlightSegment = useCallback(() => {
    const { highlightSegment, results } = directions

    if (
      !highlightSegment ||
      !results[VALHALLA_OSM_URL] ||
      !results[VALHALLA_OSM_URL].data
    ) {
      highlightRouteSegmentlayer.clearLayers()
      return
    }

    const { startIndex, endIndex, alternate } = highlightSegment

    let coords
    if (alternate == -1) {
      coords = results[VALHALLA_OSM_URL].data.decodedGeometry
    } else {
      if (
        !results[VALHALLA_OSM_URL].data.alternates ||
        !results[VALHALLA_OSM_URL].data.alternates[alternate]
      ) {
        highlightRouteSegmentlayer.clearLayers()
        return
      }
      coords =
        results[VALHALLA_OSM_URL].data.alternates[alternate].decodedGeometry
    }

    if (startIndex > -1 && endIndex > -1 && coords) {
      L.polyline(coords.slice(startIndex, endIndex + 1), {
        color: 'yellow',
        weight: 4,
        opacity: 1,
        pmIgnore: true,
      }).addTo(highlightRouteSegmentlayer)
    } else {
      highlightRouteSegmentlayer.clearLayers()
    }
  }, [directions])

  const addWaypoints = useCallback(() => {
    routeMarkersLayer.clearLayers()
    const { waypoints } = directions
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
              updateWaypointPosition({
                latLng: e.target.getLatLng(),
                index: e.target.options.index,
                fromDrag: true,
              })
            })
        }
      }
      index += 1
    }
  }, [directions, updateWaypointPosition])

  const addIsoCenter = useCallback(() => {
    isoCenterLayer.clearLayers()
    const { geocodeResults } = isochrones
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
            updateIsoPosition(e.target.getLatLng())
          })
      }
    }
  }, [isochrones, updateIsoPosition])

  const addIsochrones = useCallback(() => {
    const { results } = isochrones
    isoPolygonLayer.clearLayers()
    isoLocationsLayer.clearLayers()

    if (!results) {
      return
    }

    for (const provider of [VALHALLA_OSM_URL]) {
      if (
        results[provider] &&
        results[provider].data &&
        Object.keys(results[provider].data).length > 0 &&
        results[provider].show
      ) {
        for (const feature of results[provider].data.features) {
          const coords_reversed = []
          for (const coord of feature.geometry.coordinates) {
            coords_reversed.push([coord[1], coord[0]])
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
                getIsoTooltip(
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
                }).bindTooltip(getIsoLocationTooltip(), {
                  permanent: false,
                  sticky: true,
                })
              },
            }).addTo(isoLocationsLayer)
          }
        }
      }
    }
  }, [isochrones, getIsoTooltip, getIsoLocationTooltip])

  const addRoutes = useCallback(() => {
    const { results } = directions
    routeLineStringLayer.clearLayers()

    if (
      results[VALHALLA_OSM_URL] &&
      results[VALHALLA_OSM_URL].data &&
      Object.keys(results[VALHALLA_OSM_URL].data).length > 0
    ) {
      const response = results[VALHALLA_OSM_URL].data
      const showRoutes = results[VALHALLA_OSM_URL].show || {}
      // show alternates if they exist on the respsonse
      if (response.alternates) {
        for (let i = 0; i < response.alternates.length; i++) {
          if (!showRoutes[i]) {
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
            .bindTooltip(getRouteToolTip(summary, VALHALLA_OSM_URL), {
              permanent: false,
              sticky: true,
            })
        }
      }
      if (!showRoutes[-1]) {
        return
      }
      const coords = response.decodedGeometry
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
        .bindTooltip(getRouteToolTip(summary, VALHALLA_OSM_URL), {
          permanent: false,
          sticky: true,
        })

      if (hgRef.current && hgRef.current._showState === true) {
        hgRef.current._expand()
      }
    }
  }, [directions, getRouteToolTip])

  // Effect for handling map updates based on prop changes
  useEffect(() => {
    addWaypoints()
    addIsoCenter()
    addIsochrones()
    addRoutes()
    handleHighlightSegment()

    if (!directions.successful) {
      routeLineStringLayer.clearLayers()
    }
    if (!isochrones.successful) {
      isoPolygonLayer.clearLayers()
      isoLocationsLayer.clearLayers()
    }
  }, [
    directions.selectedAddresses,
    directions.successful,
    directions.results,
    directions.highlightSegment,
    isochrones.selectedAddress,
    isochrones.successful,
    isochrones.results,
    showRestrictions,
    activeDataset,
    addWaypoints,
    addIsoCenter,
    addIsochrones,
    addRoutes,
    handleHighlightSegment,
  ])

  // Effect for coordinates changes
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      zoomToCoordinates()
    }
  }, [coordinates, zoomToCoordinates])

  // Effect for zoom object changes
  useEffect(() => {
    if (
      directions.zoomObj &&
      directions.zoomObj.index !== undefined &&
      directions.zoomObj.timeNow
    ) {
      zoomTo(directions.zoomObj.index)
    }
  }, [directions.zoomObj, zoomTo])

  // Render function
  const MapPopup = (isInfo) => {
    if (!latLng) {
      return null
    }

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
                        latLng.lng.toFixed(6) + ', ' + latLng.lat.toFixed(6)
                      }
                      data-testid="dd-button"
                    />
                  }
                />
                <CopyToClipboard
                  text={latLng.lng.toFixed(6) + ',' + latLng.lat.toFixed(6)}
                  onCopy={handleCopy}
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
                        latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6)
                      }
                      data-testid="latlng-button"
                    />
                  }
                />
                <CopyToClipboard
                  text={latLng.lat.toFixed(6) + ',' + latLng.lng.toFixed(6)}
                  onCopy={handleCopy}
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
                        convertDDToDMS(latLng.lat) +
                        ' N ' +
                        convertDDToDMS(latLng.lng) +
                        ' E'
                      }
                      data-testid="dms-button"
                    />
                  }
                />
                <CopyToClipboard
                  text={
                    convertDDToDMS(latLng.lat) +
                    ' N ' +
                    convertDDToDMS(latLng.lng) +
                    ' E'
                  }
                  onCopy={handleCopy}
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
                      onClick={() => getLocate(latLng)}
                      compact
                      loading={isLocateLoading}
                      icon="cogs"
                      content="Locate Point"
                    />
                  }
                />
                <CopyToClipboard
                  text={JSON.stringify(locate)}
                  onCopy={handleCopy}
                >
                  <Button disabled={locate.length === 0} compact icon="copy" />
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
                      "lon": ${latLng.lng.toFixed(6)},
                      "lat": ${latLng.lat.toFixed(6)}
                    }`}
                  onCopy={handleCopy}
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
                    loading={isHeightLoading}
                    icon="resize vertical"
                    content={elevation}
                    data-testid="elevation-button"
                  />
                }
              />

              <div>
                {hasCopied && (
                  <Label size="mini" basic color="green">
                    <Icon name="checkmark" /> copied
                  </Label>
                )}
              </div>
            </div>
          </React.Fragment>
        ) : activeTab === 0 ? (
          <React.Fragment>
            <Button.Group
              data-testid="button-group-right-context"
              size="small"
              basic
              vertical
            >
              <Button compact index={0} onClick={handleAddWaypoint}>
                Directions from here
              </Button>
              <Button compact index={1} onClick={handleAddWaypoint}>
                Add as via point
              </Button>
              <Button compact index={-1} onClick={handleAddWaypoint}>
                Directions to here
              </Button>
            </Button.Group>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Button.Group size="small" basic vertical>
              <Button index={0} onClick={handleAddIsoWaypoint}>
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
        <div id="map" className="map-style" data-testid="map" />
        <button
          className="ui primary button"
          id="osm-button"
          onClick={handleOpenOSM}
        >
          Open OSM
        </button>
      </div>
      <div>
        {showPopup && leafletPopupDiv && latLng
          ? ReactDOM.createPortal(MapPopup(showInfoPopup), leafletPopupDiv)
          : null}
      </div>
    </React.Fragment>
  )
}

Map.propTypes = {
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
