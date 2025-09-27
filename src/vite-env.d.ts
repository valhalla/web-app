/// <reference types="vite/client" />

declare module '*.svg' {
  import type * as React from 'react';

  const ReactComponent: React.FunctionComponent<
    React.ComponentProps<'svg'> & { title?: string }
  >;

  export { ReactComponent };
  export default ReactComponent;
}
