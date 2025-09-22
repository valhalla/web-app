import { combineReducers } from 'redux'
import { common } from './common'
import { directions } from './directions'
import { isochrones } from './isochrones'

const rootReducer = combineReducers({
  common,
  directions,
  isochrones,
})

export default rootReducer
