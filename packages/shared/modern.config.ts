import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      input: [
        'src/index.ts',
        'src/logger.ts',
        'src/fs-extra.ts',
        'src/chalk.ts',
        'src/execa.ts',
        'src/node-utils.ts',
      ],
      target: 'esnext',
      format: 'esm',
      buildType: 'bundle',
      dts: false,
      autoExtension: true,
    },
    {
      input: [
        'src/index.ts',
        'src/logger.ts',
        'src/fs-extra.ts',
        'src/chalk.ts',
        'src/execa.ts',
        'src/node-utils.ts',
      ],
      target: 'esnext',
      format: 'cjs',
      buildType: 'bundle',
    },
  ],
});
