import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { App } from './app';
import './index.css'; // postCSS import of CSS module
import { store } from './store';

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('valhalla-app-root')
);
