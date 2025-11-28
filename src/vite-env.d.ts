/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CENTER_COORDS?: string;
  readonly VITE_NOMINATIM_URL?: string;
  readonly VITE_VALHALLA_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  import type * as React from 'react';

  const ReactComponent: React.FunctionComponent<
    React.ComponentProps<'svg'> & { title?: string }
  >;

  export { ReactComponent };
  export default ReactComponent;
}
