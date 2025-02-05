import { defineConfig, moduleTools } from '@modern-js/module-tools';

const config: ReturnType<typeof defineConfig> = defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      input: [
        'src/index.ts',
        'src/logger.ts',
        'src/chalk.ts',
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
        'src/chalk.ts',
        'src/node-utils.ts',
      ],
      target: 'esnext',
      format: 'cjs',
      buildType: 'bundle',
    },
  ],
});

export default config;
