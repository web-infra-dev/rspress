import { join } from 'node:path';
import {
  createLogger,
  createRsbuild,
  mergeRsbuildConfig,
  type RsbuildConfig,
  type RsbuildPluginAPI,
} from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import {
  type RouteMeta,
  type RspressPlugin,
  removeTrailingSlash,
} from '@rspress/core';
import { gray } from 'picocolors';
import entryContent from '../static/iframe/entry?raw';
import { STATIC_DIR } from './constants';
import { generateEntry } from './generateEntry';
import { pluginLogger } from './logger';
import { globalDemos, isDirtyRef, remarkWriteCodeFile } from './remarkPlugin';
import type { Options, StartServerResult } from './types';

const SUFFIX = gray('(preview)');
const LOG_METHODS = [
  'log',
  'info',
  'warn',
  'error',
  'debug',
  'start',
  'ready',
  'success',
  'greet',
] as const;

function createPreviewLogger() {
  const logger = createLogger();
  const original = Object.fromEntries(
    LOG_METHODS.map(m => [m, logger[m].bind(logger)]),
  );
  logger.override(
    Object.fromEntries(
      LOG_METHODS.map(m => [
        m,
        (msg: string) => original[m](`${msg} ${SUFFIX}`),
      ]),
    ),
  );
  return logger;
}

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
  let port = devPort;

  async function createDemoRsbuild() {
    const distPath = clientConfig?.output?.distPath;
    const distRoot =
      typeof distPath === 'string' ? distPath : (distPath?.root ?? 'doc_build');
    const outDir = join(distRoot, '~demo');
    const { source, output, performance, resolve } = clientConfig ?? {};
    // omit preEntry to avoid '@theme' import
    const { preEntry: _, ...otherSourceOptions } = source ?? {};

    const rsbuildInstanceConfig = mergeRsbuildConfig(
      {
        customLogger: createPreviewLogger(),
        server: {
          // allow QR code scan on mobile devices and access through local network
          host: true,
          port,
          printUrls: () => undefined,
        },
        dev: {
          lazyCompilation: false,
          writeToDisk: true,
        },
        performance: {
          printFileSize: true,
          ...performance,
          buildCache: false,
        },
        source: {
          ...otherSourceOptions,
          entry: await generateEntry(globalDemos, framework, customEntry),
          preEntry: [
            join(STATIC_DIR, 'iframe', 'entry.css'),
            ...[builderConfig.source?.preEntry ?? []].flat(),
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
            lazyCompilation: false,
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
      rsbuildConfig: rsbuildInstanceConfig,
    });

    if (framework === 'react') {
      rsbuildInstance.addPlugins([pluginReact()]);
    }
    return rsbuildInstance;
  }

  async function buildDemo() {
    const rsbuildInstance = await createDemoRsbuild();
    await rsbuildInstance.build();
  }

  async function startDemoServer() {
    if (devServer && !isDirtyRef.current) {
      return;
    }

    if (devServer) {
      await devServer.server.close();
      devServer = undefined;
      pluginLogger.info('Restarting dev server due to demo changes...');
    }

    const rsbuildInstance = await createDemoRsbuild();
    devServer = await rsbuildInstance.startDevServer();
    if (devServer.port !== port) {
      pluginLogger.info(
        `Port ${port} is in use, using port ${devServer.port} instead.`,
      );
      port = devServer.port;
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
          name: 'iframe-sync-rsbuild-instance',
          setup: (api: RsbuildPluginAPI) => {
            api.modifyRsbuildConfig(config => {
              if (config.output?.target === 'web') {
                // client build config
                clientConfig = config;
              }
              // Inject the dev port so iframe pages can connect to the demo server
              config.source ??= {};
              config.source.define ??= {};
              config.source.define['process.env.RSPRESS_IFRAME_DEV_PORT'] =
                JSON.stringify(port);
            });
            api.onAfterBuild(async () => {
              await buildDemo();
            });
            api.onAfterDevCompile(async () => {
              await startDemoServer();
            });
            api.onCloseDevServer(async () => {
              await devServer?.server?.close();
              devServer = undefined;
            });
          },
        },
      ],
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
