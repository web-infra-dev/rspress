import net from 'node:net';
import { join } from 'node:path';
import {
  createRsbuild,
  logger,
  mergeRsbuildConfig,
  type RsbuildConfig,
  type RsbuildPluginAPI,
} from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import {
  type RouteMeta,
  type RspressPlugin,
  removeTrailingSlash,
  type UserConfig,
} from '@rspress/core';
import entryContent from '../static/iframe/entry?raw';
import { STATIC_DIR } from './constants';
import { generateEntry } from './generateEntry';
import { globalDemos, isDirtyRef, remarkWriteCodeFile } from './remarkPlugin';
import type { Options, StartServerResult } from './types';

// global variables which need to be initialized in plugin
let routeMeta: RouteMeta[];

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): RspressPlugin {
  const {
    iframeOptions = {},
    defaultPreviewMode = 'internal',
    defaultRenderMode = 'pure',
    previewLanguages = ['jsx', 'tsx'],
    previewCodeTransform = ({ code }: { code: string }) => code,
  } = options ?? {};
  const {
    devPort = 7890,
    framework = 'react',
    builderConfig = {},
    customEntry,
  } = iframeOptions;

  const getRouteMeta = () => routeMeta;
  let devServer: StartServerResult | undefined;
  let clientConfig: RsbuildConfig;
  const port = devPort;

  async function rsbuildStartOrBuild(config: UserConfig, isProd: boolean) {
    if (devServer && !isProd && !isDirtyRef.current) {
      return;
    }

    if (devServer && !isProd) {
      await devServer.server.close();
      devServer = undefined;
      logger.info(
        '[@rspress/plugin-preview] Restarting preview server due to demo changes...',
      );
    }

    const outDir = join(config.outDir ?? 'doc_build', '~demo');
    const { source, output, performance, resolve } = clientConfig ?? {};
    // omit preEntry to avoid '@theme' import
    const { preEntry: _, ...otherSourceOptions } = source ?? {};

    const rsbuildConfig = mergeRsbuildConfig(
      {
        server: {
          port: devPort,
          printUrls: () => undefined,
          strictPort: true,
        },
        dev: {
          lazyCompilation: false,
          writeToDisk: true,
        },
        performance: {
          ...performance,
          printFileSize: false,
          buildCache: false,
        },
        source: {
          ...otherSourceOptions,
          entry: await generateEntry(globalDemos, framework, customEntry),
          preEntry: [
            join(STATIC_DIR, 'iframe', 'entry.css'),
            ...(builderConfig.source?.preEntry ?? []),
          ],
        },
        html: {
          tags: [
            // why not preEntry to load js?
            // avoid theme flash
            {
              tag: 'script',
              children: entryContent,
            },
          ],
        },
        resolve,
        output: {
          ...output,
          target: 'web',
          assetPrefix: output?.assetPrefix
            ? `${removeTrailingSlash(output.assetPrefix)}/~demo`
            : '/~demo',
          distPath: {
            root: outDir,
          },
          // not copy files again
          copy: undefined,
        },
        tools: {
          rspack: {
            watchOptions: {
              ignored: /\.git/,
            },
          },
        },
      },
      builderConfig,
    );
    const rsbuildInstance = await createRsbuild({
      callerName: 'rspress',
      rsbuildConfig,
    });

    if (framework === 'react') {
      rsbuildInstance.addPlugins([pluginReact()]);
    }
    if (isProd) {
      rsbuildInstance.build();
    } else {
      devServer = await rsbuildInstance.startDevServer();
    }
    isDirtyRef.current = false;
  }

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
      await rsbuildStartOrBuild(config, isProd);
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
      performance: {
        // FIXME: currently plugin preview does not support build cache
        // Because in the remarkDemo plugin, some demo files will be written, and it is required that the files must be processed by mdx-loader
        buildCache: false,
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
          remarkWriteCodeFile,
          {
            getRouteMeta,
            defaultPreviewMode,
            defaultRenderMode,
            previewLanguages,
            previewCodeTransform,
          },
        ],
      ],
      globalComponents: [join(STATIC_DIR, 'global-components', 'Preview.tsx')],
    },
    globalUIComponents: [
      join(STATIC_DIR, 'global-components', 'FixedDevice.tsx'),
    ],
  };
}

export type { Options };
