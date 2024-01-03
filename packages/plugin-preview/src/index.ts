import { join, parse, extname } from 'path';
import { type Code } from 'mdast';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import {
  type RspressPlugin,
  type RouteMeta,
  RSPRESS_TEMP_DIR,
  normalizePosixPath,
} from '@rspress/shared';
import { uniqBy } from 'lodash';
import { remarkCodeToDemo } from './codeToDemo';
import { generateId, injectDemoBlockImport } from './utils';
import {
  demoBlockComponentPath,
  demoComponentPath,
  staticPath,
} from './constant';

export type Options = {
  /**
   * preview in mobile mode or not
   * when isMobile is true, 1. aside will hide. 2. default preview component by iframe
   * @default false
   */
  isMobile?: boolean;
  /**
   * position of the iframe
   * @default 'follow'
   */
  iframePosition?: 'fixed' | 'follow';
  /**
   * determine how to handle a internal code block without meta
   * @default 'preview'
   */
  defaultRenderMode?: 'pure' | 'preview';
};

interface Heading {
  type: string;
  depth?: number;
  children?: ChildNode[];
}

interface ChildNode {
  type: 'link' | 'text' | 'inlineCode';
  value: string;
  children?: ChildNode[];
}

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];
export const demoRoutes: { path: string }[] = [];
export const demoMeta: Record<
  string,
  { id: string; virtualModulePath: string; title: string }[]
> = {};

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): RspressPlugin {
  const isMobile = options?.isMobile ?? false;
  const iframePosition = options?.iframePosition ?? 'follow';
  const defaultRenderMode = options?.defaultRenderMode ?? 'preview';

  const demoRuntimeModule = new RspackVirtualModulePlugin({});
  const globalUIComponents =
    iframePosition === 'fixed'
      ? [join(staticPath, 'global-components', 'Device.tsx')]
      : [];
  const getRouteMeta = () => routeMeta;
  return {
    name: '@rspress/plugin-preview',
    config(config) {
      config.markdown = config.markdown || {};
      config.markdown.mdxRs = false;
      return config;
    },
    extendPageData(pageData) {
      pageData.demoMeta = Object.values(demoMeta).flat();
    },
    addPages(_config, _isProd) {
      return [
        {
          routePath: '/~demo/:id',
          content: `---
pageType: "blank"
---

import Demo from ${JSON.stringify(demoComponentPath)}

<Demo iframePosition="${iframePosition}"/>
          `,
        },
      ];
    },
    async routeGenerated(routes: RouteMeta[]) {
      // init routeMeta
      routeMeta = routes;

      const files = routes.map(route => route.absolutePath);
      // Write the demo code ahead of time
      // Fix: rspack build error because demo file is not exist, probably the demo file was written in rspack build process?
      await Promise.all(
        files.map(async (filepath, _index) => {
          const isMdxFile = /\.mdx?$/.test(filepath);
          if (!isMdxFile) {
            return;
          }
          const { createProcessor } = await import('@mdx-js/mdx');
          const { visit } = await import('unist-util-visit');
          const { default: fs } = await import('@rspress/shared/fs-extra');
          const { default: remarkGFM } = await import('remark-gfm');
          let title = parse(filepath).name;
          try {
            const processor = createProcessor({
              format: extname(filepath).slice(1) as 'mdx' | 'md',
              remarkPlugins: [remarkGFM],
            });
            const source = await fs.readFile(filepath, 'utf-8');
            const ast = processor.parse(source);
            let index = 1;
            const { pageName } = routeMeta.find(
              meta =>
                normalizePosixPath(meta.absolutePath) ===
                normalizePosixPath(filepath),
            )!;

            const registerDemo = (
              demoId: string,
              demoPath: string,
              isMobileMode: boolean,
            ) => {
              if (isMobileMode) {
                // only add demoMeta in mobile mode
                demoMeta[filepath] = demoMeta[filepath] ?? [];
                const isExist = demoMeta[filepath].find(
                  item => item.id === demoId,
                );
                if (!isExist) {
                  demoMeta[filepath].push({
                    id: demoId,
                    title,
                    virtualModulePath: demoPath,
                  });
                }
              }
            };
            visit(ast, 'heading', (node: Heading) => {
              if (node.depth === 1) {
                if (node.children) {
                  title = node.children[0].value;
                }
              }
            });

            visit(ast, 'mdxJsxFlowElement', (node: any) => {
              if (node.name === 'code') {
                const src = node.attributes.find(
                  (attr: { name: string; value: string }) =>
                    attr.name === 'src',
                )?.value;
                const isMobileMode =
                  node.attributes.find(
                    (attr: { name: string; value: boolean }) =>
                      attr.name === 'isMobile',
                  )?.value ?? isMobile;
                if (!src) {
                  return;
                }
                const id = generateId(pageName, index++);
                registerDemo(id, src, isMobileMode);
              }
            });

            visit(ast, 'code', (node: Code) => {
              if (node.lang === 'jsx' || node.lang === 'tsx') {
                const { value, meta } = node;
                const hasPureMeta = meta?.includes('pure');
                const hasPreviewMeta = meta?.includes('preview');

                let noTransform;
                switch (defaultRenderMode) {
                  case 'pure':
                    noTransform = !hasPreviewMeta;
                    break;
                  case 'preview':
                    noTransform = hasPureMeta;
                    break;
                  default:
                    break;
                }

                // do not anything for pure mode
                if (noTransform) {
                  return;
                }

                // every code block can change their preview mode by meta
                const isMobileMode =
                  node?.meta?.includes('mobile') ||
                  (!node?.meta?.includes('web') && isMobile);

                const { pageName } = routeMeta.find(
                  meta =>
                    normalizePosixPath(meta.absolutePath) ===
                    normalizePosixPath(filepath),
                )!;
                const id = generateId(pageName, index++);

                const demoDir = join(
                  process.cwd(),
                  'node_modules',
                  RSPRESS_TEMP_DIR,
                  `virtual-demo`,
                );

                const virtualModulePath = join(demoDir, `${id}.tsx`);
                registerDemo(id, virtualModulePath, isMobileMode);

                fs.ensureDirSync(join(demoDir));
                fs.writeFileSync(
                  virtualModulePath,
                  injectDemoBlockImport(value, demoBlockComponentPath),
                );
              }
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
        }),
      );
      /**
       * expect the meta of each demo file is like this:
       * {
       *   id,
       *   component,
       * }
       */
      const virtualMeta = `
        ${files
          .map((filepath, index) => {
            return `import Route${index} from '${filepath}?meta';`;
          })
          .join('\n')}
        export const demos = [${files
          .map((_, index) => `Route${index}`)
          .flat()
          .join(',')}];
        `;
      demoRuntimeModule.writeModule('virtual-meta', virtualMeta);
    },
    builderConfig: {
      source: {
        include: [join(__dirname, '..')],
      },
      tools: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore
        rspack: {
          plugins: [demoRuntimeModule],
        },
        bundlerChain(chain) {
          chain.module
            .rule('Raw')
            .resourceQuery(/raw/)
            .type('asset/source')
            .end()
            .rule('MDX')
            .oneOf('MDXMeta')
            .before('MDXCompile')
            .resourceQuery(/meta/)
            .use('mdx-meta-loader')
            .loader(join(__dirname, '../mdx-meta-loader.cjs'))
            .end();

          chain.resolve.extensions.prepend('.md').prepend('.mdx');
        },
      },
    },
    markdown: {
      remarkPlugins: [
        [
          remarkCodeToDemo,
          { isMobile, getRouteMeta, iframePosition, defaultRenderMode },
        ],
      ],
      globalComponents: [
        join(staticPath, 'global-components', 'Container.tsx'),
      ],
    },
    globalUIComponents,
    globalStyles: join(
      staticPath,
      'global-styles',
      `${isMobile ? 'mobile' : 'web'}.css`,
    ),
    addSSGRoutes() {
      if (iframePosition === 'fixed') {
        const normalizeRoutes = demoRoutes.map(({ path: item }) => {
          const fragments = item.split('/').filter(Boolean);
          const demoId = fragments.pop()?.replace(/_(\d+)$/, '');
          return { path: `/${fragments.join('/')}/${demoId}` };
        });
        // Unique the routes accrodint to the path
        return uniqBy(normalizeRoutes, 'path');
      }
      return demoRoutes;
    },
  };
}

export { normalizeId } from './utils';
