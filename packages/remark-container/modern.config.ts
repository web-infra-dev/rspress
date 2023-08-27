import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
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
  ],
  plugins: [moduleTools()],
});
