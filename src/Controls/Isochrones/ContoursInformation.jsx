import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Icon } from 'semantic-ui-react'

const ContoursInformation = ({
  dispatch,
  results,
  header,
  provider,
  profile,
}) => {
  const { features } = results[provider].data

  // const handleChange = (data, event) => {
  //   const { dispatch } = this.props
  //   dispatch(showProvider(event.provider, event.checked))
  // }

  if (!features) {
    return <div>No isochrones found</div>
  }

  return (
    <React.Fragment>
      {features
        .filter((feature) => !feature.properties.type)
        .map((feature, key) => {
          return (
            <div className={'flex pb2'} key={key}>
              <div
                className={'flex'}
                style={{
                  alignSelf: 'center',
                  flexBasis: '140px',
                }}
              >
                <Icon circular name={'time'} />
                <div className={'pr2 f6 b pt1 pb1'}>
                  {feature.properties.contour + ' minutes'}
                </div>
              </div>
              <div className={'flex'} style={{ alignSelf: 'center' }}>
                <Icon circular name={'move'} />
                <div className={'pa1 b f6'}>
                  {(feature.properties.area > 1
                    ? feature.properties.area.toFixed(0)
                    : feature.properties.area.toFixed(1)) + ' km²'}
                </div>
              </div>
            </div>
          )
        })}
    </React.Fragment>
  )
}

ContoursInformation.propTypes = {
  dispatch: PropTypes.func.isRequired,
  results: PropTypes.object,
  header: PropTypes.string,
  provider: PropTypes.string,
  profile: PropTypes.string,
}

const mapStateToProps = (state) => {
  const { results } = state.isochrones
  return {
    results,
  }
}

export default connect(mapStateToProps)(ContoursInformation)
