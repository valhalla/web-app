import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import checkFile from 'eslint-plugin-check-file';
import eslintPluginTanstackQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';

export default defineConfig([
  {
    ignores: [
      'node_modules',
      'build',
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended, eslintPluginPrettier],
    settings: {
      'import/resolver': {
        'eslint-import-resolver-typescript': true,
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  {
    ...react.configs.flat.recommended,
    plugins: {
      ...react.configs.flat.recommended?.plugins,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...react.configs.flat.recommended?.rules,
      'import/no-anonymous-default-export': 'warn',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'jsx-a11y/alt-text': [
        'warn',
        {
          elements: ['img'],
          img: ['Image'],
        },
      ],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'react/jsx-no-target-blank': 'off',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'ignore' },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ...react.configs.flat['jsx-runtime'],
  },
  {
    ...reactHooks.configs.flat['recommended-latest'],
  },
  ...eslintPluginTanstackQuery.configs['flat/recommended'],
  ...pluginRouter.configs['flat/recommended'],
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{js,jsx,ts,tsx}': 'KEBAB_CASE',
        },
      ],

      'check-file/folder-naming-convention': [
        'error',
        {
          'src/**/!(__tests__|__test__|__mocks__|__snapshots__|__fixtures__)/':
            'KEBAB_CASE',
        },
      ],
    },
  },
  {
    files: [
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.d.ts',
      'src/vite-env.d.ts',
      'vite.config.ts',
      'vitest.config.ts',
    ],
    rules: {
      'check-file/filename-naming-convention': 'off',
    },
  }
]);
