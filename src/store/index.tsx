import { legacy_createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';

import reducer from '../reducers';

const middleware = [thunk];

export const store = legacy_createStore(
  reducer,
  composeWithDevTools(applyMiddleware(...middleware))
);

export type RootState = ReturnType<typeof reducer>;
