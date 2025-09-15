import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Search, Icon, Label, Popup } from 'semantic-ui-react'
import {
  doRemoveWaypoint,
  updateTextInput,
  fetchGeocode,
  makeRequest,
  isWaypoint,
} from 'actions/directionsActions'

import { zoomTo } from 'actions/commonActions'
import { isValidCoordinates } from 'utils/geom'

import { debounce } from 'throttle-debounce'

class Waypoint extends React.Component {
  static propTypes = {
    id: PropTypes.string,
    index: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
    userInput: PropTypes.string,
    isFetching: PropTypes.bool,
    results: PropTypes.array,
    use_geocoding: PropTypes.bool,
    geocodeResults: PropTypes.array,
  }

  constructor(props) {
    super(props)
    this.state = { open: false }
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.handleResultSelect = this.handleResultSelect.bind(this)
    this.fetchGeocodeResults = debounce(0, this.fetchGeocodeResults)
  }

  fetchGeocodeResults(e) {
    const { dispatch, index, userInput, use_geocoding } = this.props

    this.setState({ open: true })

    if (userInput.length > 0 && e === 'Enter') {
      // make results visible
      if (use_geocoding) {
        dispatch(
          fetchGeocode({
            inputValue: userInput,
            index: index,
          })
        )
      } else {
        const coords = userInput.split(/[\s,;]+/)
        // is this a coordinate?
        if (coords.length === 2) {
          const lat = coords[1]
          const lng = coords[0]
          if (isValidCoordinates(lat, lng)) {
            dispatch(
              fetchGeocode({
                inputValue: userInput,
                index: index,
                lngLat: [parseFloat(lng), parseFloat(lat)],
              })
            )
          }
        }
      }
    }
  }

  handleSearchChange = (event) => {
    const { dispatch, index } = this.props

    dispatch(
      updateTextInput({
        inputValue: event.target.value,
        index: index,
      })
    )
    dispatch(isWaypoint(index))
  }

  // handleSelectionChange = event => {
  //   console.log(event.target.value);
  // };

  handleResultSelect = (e, { result }) => {
    const { dispatch, index } = this.props

    this.setState({ open: false })
    dispatch(zoomTo([[result.addresslnglat[1], result.addresslnglat[0]]]))
    dispatch(
      updateTextInput({
        inputValue: result.title,
        index: index,
        addressindex: result.addressindex,
      })
    )
    dispatch(makeRequest())
  }

  resultRenderer = ({ title, description }) => (
    <div className="flex-column">
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
  )

  render() {
    const {
      dispatch,
      isFetching,
      geocodeResults,
      userInput,
      use_geocoding,
      index,
    } = this.props

    return (
      <React.Fragment>
        <div className="flex flex-row justify-between items-center">
          <Popup
            content={'Re-shuffle this waypoint'}
            size={'tiny'}
            trigger={
              <Label basic size="small">
                <Icon name="ellipsis vertical" />
                {parseInt(index) + 1}
              </Label>
            }
          />

          <Popup
            content={userInput.length === 0 ? 'Enter Address' : userInput}
            size="tiny"
            mouseEnterDelay={500}
            trigger={
              <Search
                className={'pa2 ' + index}
                size="small"
                fluid
                input={{ icon: 'search', iconPosition: 'left' }}
                onSearchChange={this.handleSearchChange}
                onResultSelect={this.handleResultSelect}
                resultRenderer={this.resultRenderer}
                type="text"
                showNoResults={false}
                open={this.state.open}
                onFocus={() => this.setState({ open: true })}
                onMouseDown={() => this.setState({ open: true })}
                onBlur={() => this.setState({ open: false })}
                loading={isFetching}
                results={geocodeResults}
                value={userInput}
                onKeyPress={(event) => {
                  this.fetchGeocodeResults(event.key)
                }}
                placeholder="Hit enter for search..."
                data-testid={'waypoint-input-' + index}
              />
            }
          />
          <div style={{ margin: '3px' }}>
            <Popup
              content={
                use_geocoding
                  ? 'Search for address'
                  : 'Enter Lon/lat coordinates'
              }
              size={'tiny'}
              trigger={
                <Icon
                  className="pointer"
                  name="checkmark"
                  disabled={userInput.length === 0}
                  // size="32px"
                  size="tiny"
                  onClick={() => this.fetchGeocodeResults('Enter')}
                />
              }
            />
          </div>
          <div style={{ margin: '3px' }}>
            <Popup
              content={'Remove this waypoint'}
              size={'tiny'}
              trigger={
                <Icon
                  className="pointer"
                  name="remove"
                  // size="32px"
                  size="tiny"
                  onClick={() => dispatch(doRemoveWaypoint(index))}
                />
              }
            />
          </div>
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { index } = ownProps
  const waypoint = state.directions.waypoints[index]
  const { geocodeResults, userInput, isFetching } = waypoint
  const { use_geocoding } = state.common.settings
  return {
    userInput,
    geocodeResults,
    isFetching,
    use_geocoding,
  }
}
export default connect(mapStateToProps)(Waypoint)
