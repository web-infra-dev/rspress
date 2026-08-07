import path from 'node:path';
import { defineConfig } from '@rspress/core';
import config from './rspress.config';

export default defineConfig({
  ...config,
  base: '/base/',
  route: { useTransitions: true },
  globalUIComponents: [path.join(import.meta.dirname, 'NavigationHarness.tsx')],
});
