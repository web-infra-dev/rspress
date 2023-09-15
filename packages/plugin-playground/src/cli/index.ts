import path, { join } from 'path';
import { type RouteMeta, type RspressPlugin } from '@rspress/shared';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import { staticPath } from '../constant';
import { getNodeAttribute, parseImports } from './utils';
import { remarkPlugin } from './remarkPlugin';

interface PlaygroundOptions {
  render: string;
}

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];

/**
 * The plugin is used to preview component.
 */
export function pluginPlayground(
  options?: Partial<PlaygroundOptions>,
): RspressPlugin {
  const { render = '' } = options || {};

  const importsVirtualModule = new RspackVirtualModulePlugin({});
  const getRouteMeta = () => routeMeta;

  if (render && !/Playground\.(jsx?|tsx?)$/.test(render)) {
    throw new Error(
      '[Playground]: render should ends with Playground.(jsx?|tsx?)',
    );
  }

  return {
    name: '@rspress/plugin-playground',
    async routeGenerated(routes: RouteMeta[]) {
      const { default: fs } = await import('@modern-js/utils/fs-extra');

      // init routeMeta
      routeMeta = routes;

      const files = routes.map(route => route.absolutePath);

      const imports: string[] = [];

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
          const { default: remarkGFM } = await import('remark-gfm');
          try {
            const processor = createProcessor({
              format: path.extname(filepath).slice(1) as 'mdx' | 'md',
              remarkPlugins: [remarkGFM],
            });
            const source = await fs.readFile(filepath, 'utf-8');
            const ast = processor.parse(source);

            visit(ast, 'mdxJsxFlowElement', (node: any) => {
              if (node.name === 'code') {
                const src = getNodeAttribute(node, 'src');
                if (!src) {
                  return;
                }
                const demoPath = join(path.dirname(filepath), src);
                if (!fs.existsSync(demoPath)) {
                  return;
                }

                const code = fs.readFileSync(demoPath, {
                  encoding: 'utf8',
                });

                const thisImports = parseImports(code);
                thisImports.forEach(
                  x => !imports.includes(x) && imports.push(x),
                );
              }
            });

            visit(ast, 'code', (node: any) => {
              if (node.lang === 'jsx' || node.lang === 'tsx') {
                const { value } = node;
                const isPure = node?.meta?.includes('pure');

                // do not anything for pure mode
                if (isPure) {
                  return;
                }

                const thisImports = parseImports(value);
                thisImports.forEach(
                  x => !imports.includes(x) && imports.push(x),
                );
              }
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
        }),
      );

      const code = [
        ...imports.map((x, index) => `import * as i_${index} from '${x}';`),
        'const importMap = new Map();',
        ...imports.map((x, index) => `importMap.set('${x}', i_${index});`),
        'export default importMap;',
      ].join('\n');

      // console.log('playground-imports', code);

      importsVirtualModule.writeModule('playground-imports', code);
    },
    builderConfig: {
      tools: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore
        rspack: {
          plugins: [importsVirtualModule],
        },
      },
    },
    markdown: {
      remarkPlugins: [[remarkPlugin, { getRouteMeta }]],
      globalComponents: [
        render
          ? render
          : path.join(staticPath, 'global-components', 'Playground.tsx'),
      ],
    },
    globalStyles: path.join(staticPath, 'global-styles', 'web.css'),
  };
}
