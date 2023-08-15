import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    sourceMap: true,
  },
});
