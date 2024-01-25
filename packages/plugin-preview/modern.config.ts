import { defineConfig, moduleTools } from '@modern-js/module-tools';
// https://modernjs.dev/module-tools/en/api
export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      input: ['./src/index.ts'],
      target: 'es2020',
      dts: {
        respectExternal: false,
      },
      externals: [
        '@rsbuild/core',
        '@rsbuild/plugin-solid',
        '@rsbuild/plugin-babel',
      ],
    },
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      input: ['./src/utils.ts'],
      target: 'es2020',
      dts: {
        respectExternal: false,
      },
    },
    // {
    //   buildType: 'bundle',
    //   format: 'esm',
    //   target: 'es2020',
    //   dts: false,
    //   input: ['./src/virtual-demo.tsx'],
    //   externals: [
    //     'virtual-meta',
    //     '@rspress/core/runtime',
    //     'react',
    //     'react-dom',
    //     'react-router-dom',
    //   ],
    //   style: {
    //     inject: true,
    //   },
    // },
  ],
  plugins: [moduleTools()],
});
