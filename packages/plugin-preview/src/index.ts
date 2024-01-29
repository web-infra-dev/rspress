import { join } from 'path';
import { type RouteMeta, type RspressPlugin } from '@rspress/shared';
import { createRsbuild } from '@rsbuild/core';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { isEqual, cloneDeep } from 'lodash';
import { remarkCodeToDemo } from './codeToDemo';
import { staticPath } from './constant';
import type { Options } from './types';
import { generateEntry } from './generate-entry';
import { demoRuntimeModule } from './virtual-module';

let routeMeta: RouteMeta[];
let isProd: boolean;

export const demoRoutes: Record<
  string,
  {
    id: string;
    path: string;
  }[]
> = {};

export const demoMeta: Record<
  string,
  { id: string; virtualModulePath: string; title: string }[]
> = {};

type StartServerResult = {
  urls: string[];
  port: number;
  server: {
    close: () => Promise<void>;
  };
};

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): RspressPlugin {
  const {
    isMobile = false,
    iframeOptions = {},
    iframePosition = 'follow',
    defaultRenderMode = 'preview',
  } = options ?? {};
  const previewMode = options?.previewMode ?? isMobile ? 'iframe' : 'internal';
  const {
    devPort = 7890,
    framework = 'react',
    position = iframePosition,
  } = iframeOptions;
  const globalUIComponents =
    iframePosition === 'fixed'
      ? [join(staticPath, 'global-components', 'Device.tsx')]
      : [];
  const getInfo = () => ({
    isProd,
    routeMeta,
  });
  let lastDemoRoutes: typeof demoRoutes;
  let devServer: StartServerResult;
  return {
    name: '@rspress/plugin-preview',
    config(config) {
      config.markdown = config.markdown || {};
      config.markdown.mdxRs = false;
      return config;
    },
    routeGenerated(routes: RouteMeta[]) {
      // init routeMeta
      routeMeta = routes;
    },
    beforeBuild(_, isProduction) {
      isProd = isProduction;
    },
    async afterBuild(config, isProd) {
      if (isEqual(demoRoutes, lastDemoRoutes)) {
        console.log(true);
        return;
      } else {
        console.log(false);

        lastDemoRoutes = cloneDeep(demoRoutes);
        await devServer?.server?.close();
      }
      const sourceEntry = generateEntry(demoRoutes, framework, position);
      const outDir = join(config.outDir ?? 'doc_build', '~demo');
      const rsbuildInstance = await createRsbuild({
        rsbuildConfig: {
          dev: {
            progressBar: false,
          },
          server: {
            printUrls: () => undefined,
            port: devPort,
          },
          source: {
            entry: sourceEntry,
          },
          output: {
            distPath: {
              root: outDir,
            },
          },
          tools: {
            rspack: {
              output: {
                publicPath: '/~demo',
              },
            },
          },
        },
      });
      if (framework === 'solid') {
        rsbuildInstance.addPlugins([
          pluginBabel({
            include: /\.(?:jsx|tsx)$/,
          }),
          pluginSolid(),
        ]);
      }
      if (isProd) {
        rsbuildInstance.build();
      } else {
        console.log(devPort);
        devServer = await rsbuildInstance.startDevServer({
          getPortSilently: false,
        });
      }
    },
    builderConfig: {
      source: {
        include: [join(__dirname, '..')],
      },
      tools: {
        rspack: {
          plugins: [demoRuntimeModule],
        },
        bundlerChain(chain) {
          chain.module
            .rule('Raw')
            .resourceQuery(/raw/)
            .type('asset/source')
            .end();

          chain.resolve.extensions.prepend('.md').prepend('.mdx');
        },
      },
    },
    extendPageData(pageData, isProd) {
      if (!isProd) {
        pageData.devPort = devPort;
      }
    },
    markdown: {
      remarkPlugins: [
        [
          remarkCodeToDemo,
          {
            getInfo,
            devPort,
            framework,
            position,
            previewMode,
            defaultRenderMode,
          },
        ],
      ],
      globalComponents: [
        join(staticPath, 'global-components', 'Container.tsx'),
      ],
    },
    globalUIComponents,
    globalStyles: join(staticPath, 'global-styles', `${previewMode}.css`),
  };
}

export { normalizeId } from './utils';

export type { Options };
