import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css'; // postCSS import of CSS module
import { store } from './store';
import { RouterProvider } from '@tanstack/react-router';
import * as TanStackQueryProvider from './lib/tanstack-query/root-provider';
import { router } from './routes';

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();

const rootElement = document.getElementById('valhalla-app-root');

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <Provider store={store}>
        <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
          <RouterProvider router={router} />
        </TanStackQueryProvider.Provider>
      </Provider>
    </StrictMode>
  );
}
