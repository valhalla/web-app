import React, {
  Fragment,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { debounce } from 'throttle-debounce'
import Drawer from 'react-modern-drawer'
import 'react-modern-drawer/dist/index.css'
import {
  Divider,
  Form,
  Grid,
  Header,
  Icon,
  Popup,
  Segment,
  Accordion,
  Dropdown,
  Button,
} from 'semantic-ui-react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { profile_settings, settings_general } from './settings-options'
import {
  updateSettings,
  doShowSettings,
  filterProfileSettings,
  resetSettings,
} from 'actions/commonActions'

import CustomSlider from '../components/CustomSlider'
import { makeRequest } from 'actions/directionsActions'
import { makeIsochronesRequest } from 'actions/isochronesActions'
import { Checkbox } from 'components/Checkbox'

const SettingsPanel = ({
  dispatch,
  profile,
  settings,
  showSettings,
  activeTab,
}) => {
  const [generalSettings, setGeneralSettings] = useState({})
  const [extraSettings, setExtraSettings] = useState({})
  const [directionsSettings, setDirectionsSettings] = useState({})
  const [copied, setCopied] = useState(false)

  const prevPropsRef = useRef()

  const handleUpdateSettings = useCallback(
    debounce(100, ({ name, value }) => {
      dispatch(
        updateSettings({
          name,
          value,
        })
      )
    }),
    [dispatch]
  )

  useEffect(() => {
    if (
      prevPropsRef.current &&
      !R.equals(profile, prevPropsRef.current.profile)
    ) {
      setGeneralSettings((prev) => {
        const newSettings = { ...prev }
        Object.keys(newSettings).forEach((v) => (newSettings[v] = false))
        return newSettings
      })

      setExtraSettings((prev) => {
        const newSettings = { ...prev }
        Object.keys(newSettings).forEach((v) => (newSettings[v] = false))
        return newSettings
      })

      setDirectionsSettings((prev) => {
        const newSettings = { ...prev }
        Object.keys(newSettings).forEach((v) => (newSettings[v] = false))
        return newSettings
      })
    }
  }, [profile])

  useEffect(() => {
    if (
      prevPropsRef.current &&
      R.equals(profile, prevPropsRef.current.profile) &&
      !R.equals(settings, prevPropsRef.current.settings)
    ) {
      if (activeTab === 0) {
        dispatch(makeRequest())
      } else {
        dispatch(makeIsochronesRequest())
      }
    }
  }, [settings, profile, activeTab, dispatch])

  useEffect(() => {
    prevPropsRef.current = { profile, settings, showSettings, activeTab }
  })

  const handleShowSettings = useCallback((settingsType, i) => {
    const setterMap = {
      generalSettings: setGeneralSettings,
      extraSettings: setExtraSettings,
      directionsSettings: setDirectionsSettings,
    }

    const setter = setterMap[settingsType]
    if (setter) {
      setter((prev) => ({
        ...prev,
        [i]: !prev[i],
      }))
    }
  }, [])

  const handleColorCopy = useCallback(() => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }, [])

  const handleBikeTypeChange = useCallback(
    (e, data) => {
      const { value, name } = data
      dispatch(
        updateSettings({
          name,
          value,
        })
      )
    },
    [dispatch]
  )

  const resetConfigSettings = useCallback(() => {
    dispatch(resetSettings())
  }, [dispatch])

  const extractSettings = useCallback((profileParam, settingsParam) => {
    return JSON.stringify(filterProfileSettings(profileParam, settingsParam))
  }, [])

  const no_profile_settings = profile_settings[profile].boolean.length === 0
  const width = no_profile_settings ? 200 : 400

  return (
    <Drawer
      enableOverlay={false}
      open={showSettings}
      direction="right"
      size="400"
      style={{
        zIndex: 1001,
        maxWidth: width,
        overflow: 'auto',
      }}
    >
      <Segment>
        <Grid columns={16} divided>
          <Grid.Row>
            {!no_profile_settings && (
              <Grid.Column width={8}>
                <Form size={'small'}>
                  <Header as="h4">Extra Settings</Header>
                  {profile_settings[profile].numeric.map((option, key) => (
                    <Fragment key={key}>
                      <div className="flex pointer">
                        <div
                          onClick={() =>
                            handleShowSettings('extraSettings', key)
                          }
                        >
                          <Icon
                            name={
                              extraSettings[key] ? 'caret down' : 'caret right'
                            }
                          />
                          <span className="b f6">{option.name}</span>
                        </div>
                        <div
                          style={{
                            marginLeft: 'auto',
                          }}
                        >
                          <Popup
                            content={option.description}
                            size={'tiny'}
                            trigger={<Icon color="grey" name="help circle" />}
                          />
                        </div>
                      </div>
                      {extraSettings[key] ? (
                        <CustomSlider
                          key={key}
                          option={option}
                          dispatch={dispatch}
                          settings={settings}
                          profile={profile}
                          handleUpdateSettings={handleUpdateSettings}
                        />
                      ) : null}
                    </Fragment>
                  ))}
                  <Divider />
                  <Fragment>
                    {profile_settings[profile].boolean.map((option, key) => {
                      return (
                        <div key={key} className="flex">
                          <Checkbox
                            option={option}
                            dispatch={dispatch}
                            settings={settings}
                          />
                          <div
                            style={{
                              marginLeft: 'auto',
                            }}
                          >
                            <Popup
                              content={option.description}
                              size={'tiny'}
                              trigger={<Icon color="grey" name="help circle" />}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </Fragment>
                  <Divider />
                  <Fragment>
                    {profile_settings[profile].enum.map((option, key) => {
                      return (
                        <div key={key} className="flex">
                          <Dropdown
                            placeholder="Select Bicycle Type"
                            fluid
                            onChange={handleBikeTypeChange}
                            value={settings.bicycle_type}
                            selection
                            name={'bicycle_type'}
                            options={option.enums}
                          />

                          <div
                            style={{
                              marginLeft: 'auto',
                            }}
                          >
                            <Popup
                              content={option.description}
                              size={'tiny'}
                              trigger={<Icon color="grey" name="help circle" />}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </Fragment>
                </Form>
              </Grid.Column>
            )}
            <Grid.Column width={no_profile_settings ? 16 : 8}>
              <Form size={'small'}>
                <div className={'flex flex-row justify-between'}>
                  <Header as="h4">General Settings</Header>
                  <Button icon onClick={() => dispatch(doShowSettings())}>
                    <Icon name="close" />
                  </Button>
                </div>
                <Accordion>
                  {settings_general[profile].numeric.map((option, key) => (
                    <Fragment key={key}>
                      <div className="flex pointer">
                        <div
                          onClick={() =>
                            handleShowSettings('generalSettings', key)
                          }
                        >
                          <Icon
                            name={
                              generalSettings[key]
                                ? 'caret down'
                                : 'caret right'
                            }
                          />
                          <span className="b f6">{option.name}</span>
                        </div>
                        <div
                          style={{
                            marginLeft: 'auto',
                          }}
                        >
                          <Popup
                            content={option.description}
                            size={'tiny'}
                            trigger={<Icon color="grey" name="help circle" />}
                          />
                        </div>
                      </div>
                      {generalSettings[key] ? (
                        <CustomSlider
                          key={key}
                          option={option}
                          dispatch={dispatch}
                          settings={settings}
                          profile={profile}
                          handleUpdateSettings={handleUpdateSettings}
                        />
                      ) : null}
                    </Fragment>
                  ))}
                </Accordion>
                <Divider />
                {settings_general[profile].boolean.map((option, key) => {
                  return (
                    <div key={key} className="flex">
                      <Checkbox
                        key={key}
                        option={option}
                        dispatch={dispatch}
                        settings={settings}
                      />
                      <div
                        style={{
                          marginLeft: 'auto',
                        }}
                      >
                        <Popup
                          content={option.description}
                          size={'tiny'}
                          trigger={<Icon color="grey" name="help circle" />}
                        />
                      </div>
                    </div>
                  )
                })}
                {settings_general.all.boolean.map((option, key) => {
                  return (
                    <div key={key} className="flex">
                      <Checkbox
                        key={key}
                        option={option}
                        dispatch={dispatch}
                        settings={settings}
                      />
                      <div
                        style={{
                          marginLeft: 'auto',
                        }}
                      >
                        <Popup
                          content={option.description}
                          size={'tiny'}
                          trigger={<Icon color="grey" name="help circle" />}
                        />
                      </div>
                    </div>
                  )
                })}
                {settings_general.all.numeric.map((option, key) => {
                  return (
                    <Fragment key={key}>
                      <div className="flex pointer">
                        <div
                          onClick={() =>
                            handleShowSettings('directionsSettings', key)
                          }
                        >
                          <Icon
                            name={
                              directionsSettings[key]
                                ? 'caret down'
                                : 'caret right'
                            }
                          />
                          <span className="b f6">{option.name}</span>
                        </div>
                        <div
                          style={{
                            marginLeft: 'auto',
                          }}
                        >
                          <Popup
                            content={option.description}
                            size={'tiny'}
                            trigger={<Icon color="grey" name="help circle" />}
                          />
                        </div>
                      </div>
                      {directionsSettings[key] ? (
                        <CustomSlider
                          key={key}
                          option={option}
                          dispatch={dispatch}
                          settings={settings}
                          profile={profile}
                          handleUpdateSettings={handleUpdateSettings}
                        />
                      ) : null}
                    </Fragment>
                  )
                })}
              </Form>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={16}>
              <CopyToClipboard
                text={extractSettings(profile, settings)}
                onCopy={handleColorCopy}
              >
                <Button
                  basic
                  size="mini"
                  icon
                  color={copied ? 'green' : undefined}
                  labelPosition="left"
                >
                  <Icon name="copy" />
                  Copy to Clipboard
                </Button>
              </CopyToClipboard>
              <Button
                basic
                size="mini"
                icon
                onClick={resetConfigSettings}
                labelPosition="left"
              >
                <Icon name="remove" />
                Reset
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    </Drawer>
  )
}

SettingsPanel.propTypes = {
  id: PropTypes.number,
  index: PropTypes.number,
  activeTab: PropTypes.number,
  message: PropTypes.object,
  profile: PropTypes.string,
  settings: PropTypes.object,
  showSettings: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
}

const MemoizedSettingsPanel = React.memo(
  SettingsPanel,
  (prevProps, nextProps) => {
    return (
      R.equals(prevProps.settings, nextProps.settings) &&
      R.equals(prevProps.profile, nextProps.profile) &&
      R.equals(prevProps.showSettings, nextProps.showSettings) &&
      R.equals(prevProps.activeTab, nextProps.activeTab)
    )
  }
)

const mapStateToProps = (state) => {
  const { message, profile, settings, activeTab, showSettings } = state.common
  return {
    showSettings,
    message,
    profile,
    settings,
    activeTab,
  }
}

export default connect(mapStateToProps)(MemoizedSettingsPanel)
