import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // postCSS import of CSS module
import { RouterProvider } from '@tanstack/react-router';
import * as TanStackQueryProvider from './lib/tanstack-query/root-provider';
import { router } from './routes';

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();

const rootElement = document.getElementById('valhalla-app-root');

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <RouterProvider router={router} />
      </TanStackQueryProvider.Provider>
    </StrictMode>
  );
}
