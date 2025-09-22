import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { App } from './App';
import './index.css'; // postCSS import of CSS module
import { store } from './store';

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('valhalla-app-root')
);
