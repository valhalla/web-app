import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'node_modules',
      'build',
      'dist',
      'coverage',
      'e2e',
      'playwright-report',
      'test-results',
    ],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'playwright-report/',
        'src/test-utils.ts',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
