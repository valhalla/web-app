import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['node_modules', 'build', 'dist', 'coverage', 'e2e'],
  },
});
