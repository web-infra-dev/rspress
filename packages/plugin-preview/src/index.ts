import { join, resolve } from 'path';
import { type RouteMeta, type RspressPlugin } from '@rspress/shared';
import { createRsbuild } from '@rsbuild/core';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { demoRuntimeModule } from './virtual-module';
import { remarkCodeToDemo } from './codeToDemo';
import { staticPath } from './constant';

type IframeOptions = {
  framework?: 'react' | 'solid';
  position?: 'fixed' | 'follow';
  devPort?: number;
};

export type Options = {
  /**
   * @deprecated Use previewMode instead.
   * true = 'iframe'
   * false = 'internal'
   */
  isMobile?: boolean;
  /**
   * internal mode: component will be rendered inside the documentation, only support react.
   *
   * inframe mode: component will be rendered in iframe, note that aside will hide.
   * @default 'internal'
   */
  previewMode?: 'internal' | 'iframe';
  /**
   * position of the iframe
   * @default 'follow'
   */
  iframePosition?: 'fixed' | 'follow';
  iframeOptions?: IframeOptions;
  /**
   * determine how to handle a internal code block without meta
   * @default 'preview'
   */
  defaultRenderMode?: 'pure' | 'preview';
};

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];
let isProd: boolean;
let firstBuild = true;
export const demoRoutes: {
  id: string;
  url: string;
  path: string;
  entry: string;
}[] = [];
export const demoMeta: Record<
  string,
  { id: string; virtualModulePath: string; title: string }[]
> = {};

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): RspressPlugin {
  const isMobile = options?.isMobile ?? false;
  const previewMode =
    options?.previewMode ?? options?.isMobile ? 'iframe' : 'internal';
  const iframePosition = options?.iframePosition ?? 'follow';
  const defaultRenderMode = options?.defaultRenderMode ?? 'preview';
  const { devPort = 7890, framework = 'react' } = options?.iframeOptions ?? {};
  const globalUIComponents =
    iframePosition === 'fixed'
      ? [join(staticPath, 'global-components', 'Device.tsx')]
      : [];
  const getRouteMeta = () => routeMeta;
  const getIframeInfo = () => ({
    isProd,
    devPort,
    framework,
  });
  return {
    name: '@rspress/plugin-preview',
    config(config) {
      config.markdown = config.markdown || {};
      config.markdown.mdxRs = false;
      return config;
    },
    async routeGenerated(routes: RouteMeta[]) {
      // init routeMeta
      routeMeta = routes;
    },
    beforeBuild(_, isProduction) {
      isProd = isProduction;
    },
    async afterBuild(config, isProd) {
      if (isMobile && iframePosition === 'fixed') {
        // TODO: write entry for all page
      }
      const meta = `
      export const demos = ${JSON.stringify(demoRoutes)}
      `;
      demoRuntimeModule.writeModule('virtual-meta', meta);
      if (!firstBuild) {
        return;
      }
      firstBuild = false;
      const sourceEntry: Record<string, string> = {};
      demoRoutes.forEach(route => {
        const { id, entry } = route;
        sourceEntry[id] = entry;
      });
      const outDir = resolve(config.outDir ?? 'doc_build', '~demo');
      // Create demo dev server
      const rsbuildInstance = await createRsbuild({
        rsbuildConfig: {
          dev: {
            progressBar: false,
          },
          server: {
            // Don't display the demo server log
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
        rsbuildInstance.startDevServer({
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
    markdown: {
      remarkPlugins: [
        [
          remarkCodeToDemo,
          {
            isMobile,
            getRouteMeta,
            iframePosition,
            defaultRenderMode,
            getIframeInfo,
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
