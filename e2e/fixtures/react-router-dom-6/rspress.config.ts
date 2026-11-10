import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  llms: true,
  globalUIComponents: [path.join(import.meta.dirname, 'TransitionProbe.tsx')],
});
