import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './app';
import './index.css'; // postCSS import of CSS module
import { store } from './store';

createRoot(document.getElementById('valhalla-app-root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
