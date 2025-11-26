import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import {
  defineConfig,
  loadEnv,
  createFilter,
  transformWithEsbuild,
  type ConfigEnv,
  type UserConfig,
  type Plugin,
} from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }: ConfigEnv) => {
  setEnv(mode);
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      envPlugin(),
      devServerPlugin(),
      buildPathPlugin(),
      basePlugin(),
      importPrefixPlugin(),
      htmlPlugin(mode),
      svgrPlugin(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});

function setEnv(mode: string) {
  Object.assign(
    process.env,
    loadEnv(mode, '.', ['REACT_APP_', 'NODE_ENV', 'PUBLIC_URL'])
  );
  process.env.NODE_ENV ??= mode;
  const { homepage } = JSON.parse(readFileSync('package.json', 'utf-8')) as {
    homepage: string;
  };
  process.env.PUBLIC_URL ??= homepage
    ? `${
        homepage.startsWith('http') || homepage.startsWith('/')
          ? homepage
          : `/${homepage}`
      }`.replace(/\/$/, '')
    : '';
}

// Expose `process.env` environment variables to your client code
function envPlugin(): Plugin {
  return {
    name: 'env-plugin',
    config(_config: UserConfig, { mode }: ConfigEnv) {
      const env = loadEnv(mode, '.', ['REACT_APP_', 'NODE_ENV', 'PUBLIC_URL']);
      return {
        define: Object.fromEntries(
          Object.entries(env).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value),
          ])
        ),
      };
    },
  };
}

// Setup HOST, SSL, PORT
// https://vitejs.dev/config/server-options.html#server-host
// https://vitejs.dev/config/server-options.html#server-https
// https://vitejs.dev/config/server-options.html#server-port
function devServerPlugin(): Plugin {
  return {
    name: 'dev-server-plugin',
    config(_config: UserConfig, { mode }: ConfigEnv) {
      const { HOST, PORT, HTTPS, SSL_CRT_FILE, SSL_KEY_FILE } = loadEnv(
        mode,
        '.',
        ['HOST', 'PORT', 'HTTPS', 'SSL_CRT_FILE', 'SSL_KEY_FILE']
      );
      const https = HTTPS === 'true';
      return {
        server: {
          host: HOST || '0.0.0.0',
          port: parseInt(PORT || '3000', 10),
          open: true,
          ...(https &&
            SSL_CRT_FILE &&
            SSL_KEY_FILE && {
              https: {
                cert: readFileSync(resolve(SSL_CRT_FILE)),
                key: readFileSync(resolve(SSL_KEY_FILE)),
              },
            }),
        },
      };
    },
  };
}

// https://vitejs.dev/config/build-options.html#build-outdir
function buildPathPlugin(): Plugin {
  return {
    name: 'build-path-plugin',
    config(_config: UserConfig, { mode }: ConfigEnv) {
      const { BUILD_PATH } = loadEnv(mode, '.', ['BUILD_PATH']);
      return {
        build: {
          outDir: BUILD_PATH || 'build',
        },
      };
    },
  };
}

// https://vitejs.dev/config/shared-options.html#base
function basePlugin(): Plugin {
  return {
    name: 'base-plugin',
    config(_config: UserConfig, { mode }: ConfigEnv) {
      const { PUBLIC_URL } = loadEnv(mode, '.', ['PUBLIC_URL']);
      return {
        base: PUBLIC_URL ?? '',
      };
    },
  };
}

// To resolve modules from node_modules, you can prefix paths with ~
// https://create-react-app.dev/docs/adding-a-sass-stylesheet
// https://vitejs.dev/config/shared-options.html#resolve-alias
function importPrefixPlugin(): Plugin {
  return {
    name: 'import-prefix-plugin',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config(_config: UserConfig, _env: ConfigEnv) {
      return {
        resolve: {
          alias: [{ find: /^~([^/])/, replacement: '$1' }],
        },
      };
    },
  };
}

// In Create React App, SVGs can be imported directly as React components. This is achieved by svgr libraries.
// https://create-react-app.dev/docs/adding-images-fonts-and-files/#adding-svgs
function svgrPlugin(): Plugin {
  const filter = createFilter('**/*.svg');
  const postfixRE = /[?#].*$/s;
  return {
    name: 'svgr-plugin',
    async transform(code: string, id: string) {
      if (filter(id)) {
        const { transform } = await import('@svgr/core');
        const { default: jsx } = await import('@svgr/plugin-jsx');
        const filePath = id.replace(postfixRE, '');
        const svgCode = readFileSync(filePath, 'utf8');
        const componentCode = await transform(svgCode, undefined, {
          filePath,
          caller: {
            previousExport: code,
            defaultPlugins: [jsx],
          },
        });
        const res = await transformWithEsbuild(componentCode, id, {
          loader: 'jsx',
        });
        return {
          code: res.code,
          map: null,
        };
      }
    },
  };
}

// Replace %ENV_VARIABLES% in index.html
// https://vitejs.dev/guide/api-plugin.html#transformindexhtml
// https://vitejs.dev/guide/env-and-mode.html#html-env-replacement
function htmlPlugin(_mode: string): Plugin {
  return {
    name: 'html-plugin',
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        const env = loadEnv(_mode, '.', [
          'REACT_APP_',
          'NODE_ENV',
          'PUBLIC_URL',
        ]);
        return html.replace(
          /%(.*?)%/g,
          (match: string, p1: string) => env[p1] ?? match
        );
      },
    },
  };
}
