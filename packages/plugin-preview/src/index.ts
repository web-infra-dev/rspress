import { join } from 'node:path';
import net from 'node:net';
import {
  type RouteMeta,
  type RspressPlugin,
  removeTrailingSlash,
} from '@rspress/shared';
import {
  type RsbuildConfig,
  createRsbuild,
  mergeRsbuildConfig,
} from '@rsbuild/core';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { isEqual, cloneDeep } from 'lodash';
import { remarkCodeToDemo, demos } from './remarkPlugin';
import { staticPath } from './constant';
import type { Options, StartServerResult } from './types';
import { generateEntry } from './generate-entry';

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
  const previewMode = options?.previewMode ?? isMobile ? 'iframe' : 'internal';
  const {
    devPort = 7890,
    framework = 'react',
    position = iframePosition,
    builderConfig = {},
  } = iframeOptions;
  const globalUIComponents =
    position === 'fixed'
      ? [join(staticPath, 'global-components', 'Device.tsx')]
      : [];
  const getRouteMeta = () => routeMeta;
  let lastDemos: typeof demos;
  let devServer: StartServerResult;
  let clientConfig: RsbuildConfig;
  const port = devPort;
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
        } catch (e: any) {
          if (e.code !== 'EADDRINUSE') {
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
      const sourceEntry = generateEntry(demos, framework, position);
      const outDir = join(config.outDir ?? 'doc_build', '~demo');
      if (Object.keys(sourceEntry).length === 0) {
        return;
      }
      const { html, source, output, performance } = clientConfig ?? {};
      const rsbuildConfig = mergeRsbuildConfig(
        {
          dev: {
            progressBar: false,
          },
          server: {
            port: devPort,
            printUrls: () => undefined,
            strictPort: true,
          },
          performance: {
            ...performance,
            printFileSize: false,
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
          plugins: config?.builderPlugins,
        },
        builderConfig,
      );
      const rsbuildInstance = await createRsbuild({
        rsbuildConfig,
      });

      const { pluginSass } = await import('@rsbuild/plugin-sass');
      const { pluginLess } = await import('@rsbuild/plugin-less');

      rsbuildInstance.addPlugins([pluginSass(), pluginLess()]);

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
      },
      plugins: [
        {
          name: 'close-demo-server',
          setup: api => {
            api.modifyRsbuildConfig(config => {
              if (config.output?.targets?.every(target => target === 'web')) {
                // client build config
                clientConfig = config;
              }
            });
            api.onCloseDevServer(async () => {
              await devServer?.server?.close();
            });
          },
        },
      ],
    },
    extendPageData(pageData, isProd) {
      if (!isProd) {
        pageData.devPort = port;
      }
      // highlightLanguages analysis is built-in in mdx-rs, we need to add extraHighlightLanguages in preview plugin which using mdx-js to perform code block
      pageData.extraHighlightLanguages = previewLanguages;
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
