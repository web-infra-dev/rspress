import net from 'node:net';
import { join } from 'node:path';
import {
  createRsbuild,
  mergeRsbuildConfig,
  type RsbuildConfig,
  type RsbuildPluginAPI,
} from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSolid } from '@rsbuild/plugin-solid';
import {
  type RouteMeta,
  type RspressPlugin,
  removeTrailingSlash,
} from '@rspress/core';
import { cloneDeep, isEqual } from 'lodash';
import { staticPath } from './constant';
import { generateEntry } from './generate-entry';
import { demos, remarkCodeToDemo } from './remarkPlugin';
import type { Options, StartServerResult } from './types';

// global variables which need to be initialized in plugin
let routeMeta: RouteMeta[];

const DEFAULT_PREVIEW_LANGUAGES = ['jsx', 'tsx'];

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): RspressPlugin {
  const {
    isMobile = false,
    iframeOptions = {},
    iframePosition = 'follow',
    defaultRenderMode = 'preview',
    previewLanguages = DEFAULT_PREVIEW_LANGUAGES,
    previewCodeTransform = ({ code }: { code: string }) => code,
  } = options ?? {};
  const previewMode =
    options?.previewMode ?? (isMobile ? 'iframe' : 'internal');
  const {
    devPort = 7890,
    framework = 'react',
    position = iframePosition,
    builderConfig = {},
    customEntry,
  } = iframeOptions;
  const globalUIComponents =
    position === 'fixed'
      ? [join(staticPath, 'global-components', 'Device.tsx')]
      : [];
  const getRouteMeta = () => routeMeta;
  let lastDemos: typeof demos;
  let devServer: StartServerResult | undefined;
  let clientConfig: RsbuildConfig;
  const port = devPort;
  return {
    name: '@rspress/plugin-preview',
    config(config) {
      config.markdown = config.markdown || {};
      return config;
    },
    routeGenerated(routes: RouteMeta[]) {
      // init routeMeta
      routeMeta = routes;
    },
    async beforeBuild(_, isProd) {
      if (!isProd) {
        try {
          await new Promise((resolve, reject) => {
            const server = net.createServer();
            server.unref();
            server.on('error', reject);
            server.listen({ port, host: '0.0.0.0' }, () => {
              server.close(resolve);
            });
          });
        } catch (e) {
          if (
            !!e &&
            typeof e === 'object' &&
            'code' in e &&
            e.code !== 'EADDRINUSE'
          ) {
            throw e;
          }

          throw new Error(
            `Port "${port}" is occupied, please choose another one.`,
          );
        }
      }
    },
    async afterBuild(config, isProd) {
      if (isEqual(demos, lastDemos)) {
        return;
      }
      lastDemos = cloneDeep(demos);
      await devServer?.server?.close();
      devServer = undefined;
      const sourceEntry = await generateEntry(
        demos,
        framework,
        position,
        customEntry,
      );
      const outDir = join(config.outDir ?? 'doc_build', '~demo');
      if (Object.keys(sourceEntry).length === 0) {
        return;
      }
      const { html, source, output, performance } = clientConfig ?? {};
      const rsbuildConfig = mergeRsbuildConfig(
        {
          server: {
            port: devPort,
            printUrls: () => undefined,
            strictPort: true,
          },
          dev: {
            lazyCompilation: false,
          },
          performance: {
            ...performance,
            printFileSize: false,
            buildCache: false,
          },
          html,
          source: {
            ...source,
            entry: sourceEntry,
          },
          output: {
            ...output,
            assetPrefix: output?.assetPrefix
              ? `${removeTrailingSlash(output.assetPrefix)}/~demo`
              : '/~demo',
            distPath: {
              root: outDir,
            },
            // not copy files again
            copy: undefined,
          },
        },
        builderConfig,
      );
      const rsbuildInstance = await createRsbuild({
        callerName: 'rspress',
        rsbuildConfig,
      });

      if (framework === 'solid') {
        rsbuildInstance.addPlugins([
          pluginBabel({
            include: /\.(?:jsx|tsx)$/,
          }),
          pluginSolid(),
        ]);
      }
      if (framework === 'react') {
        rsbuildInstance.addPlugins([pluginReact()]);
      }
      if (isProd) {
        rsbuildInstance.build();
      } else {
        devServer = await rsbuildInstance.startDevServer();
      }
    },
    builderConfig: {
      source: {
        include: [join(__dirname, '..')],
      },
      tools: {
        bundlerChain(chain) {
          chain.module
            .rule('Raw')
            .resourceQuery(/raw/)
            .type('asset/source')
            .end();

          chain.resolve.extensions.prepend('.md').prepend('.mdx');
        },
        rspack: {
          watchOptions: {
            ignored: /\.git/,
          },
        },
      },
      plugins: [
        {
          name: 'close-demo-server',
          setup: (api: RsbuildPluginAPI) => {
            api.modifyRsbuildConfig(config => {
              if (config.output?.target === 'web') {
                // client build config
                clientConfig = config;
              }
            });
            api.onCloseDevServer(async () => {
              await devServer?.server?.close();
              devServer = undefined;
            });
          },
        },
      ],
    },
    extendPageData(pageData, isProd) {
      if (!isProd) {
        // Property 'devPort' does not exist on type 'PageIndexInfo'.
        // @ts-expect-error
        pageData.devPort = port;
      }
    },
    markdown: {
      remarkPlugins: [
        [
          remarkCodeToDemo,
          {
            getRouteMeta,
            position,
            previewMode,
            defaultRenderMode,
            previewLanguages,
            previewCodeTransform,
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

export type { Options };
