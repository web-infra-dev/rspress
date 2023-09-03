import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      target: 'esnext',
      format: 'esm',
      buildType: 'bundle',
      esbuildOptions(options) {
        delete options.outdir;
        options.outfile = 'dist/index.mjs';
        return options;
      },
    },
    {
      target: 'esnext',
      format: 'cjs',
      buildType: 'bundle',
    },
    {
      input: {
        logger: './src/logger.ts',
      },
      target: 'esnext',
      format: 'esm',
      buildType: 'bundle',
      esbuildOptions(options) {
        delete options.outdir;
        options.outfile = 'dist/logger.mjs';
        return options;
      },
    },
    {
      input: {
        logger: './src/logger.ts',
      },
      target: 'esnext',
      format: 'cjs',
      buildType: 'bundle',
    },
  ],
});
