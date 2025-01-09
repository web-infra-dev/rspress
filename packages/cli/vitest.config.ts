import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: __dirname,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
});
