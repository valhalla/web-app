import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['node_modules', 'build', 'dist', 'coverage'] },
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
      'react/prop-types': 'off',
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
    ...reactHooks.configs['recommended-latest'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  }
);
