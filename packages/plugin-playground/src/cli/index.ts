import path, { join } from 'node:path';
import type { RouteMeta, RspressPlugin } from '@rspress/shared';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import type {
  loader,
  EditorProps as MonacoEditorProps,
} from '@monaco-editor/react';
import type { Code } from 'mdast';
import { staticPath } from './constant';
import { getNodeAttribute, parseImports } from './utils';
import { remarkPlugin } from './remarkPlugin';
import { DEFAULT_BABEL_URL, DEFAULT_MONACO_URL } from '@/web/constant';
import { normalizeUrl } from '@/web/utils';

interface PlaygroundOptions {
  render: string;
  include: Array<string | [string, string]>;

  defaultDirection: 'horizontal' | 'vertical';
  editorPosition: 'left' | 'right';

  babelUrl: string;

  monacoLoader: Parameters<typeof loader.config>[0];
  monacoOptions: MonacoEditorProps['options'];
  /**
   * determine how to handle a internal code block without meta
   * @default 'playground'
   */
  defaultRenderMode?: 'pure' | 'playground';
}

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];

/**
 * The plugin is used to preview component.
 */
export function pluginPlayground(
  options?: Partial<PlaygroundOptions>,
): RspressPlugin {
  const {
    render = '',
    include,
    defaultDirection = 'horizontal',
    editorPosition = 'left',
    babelUrl = DEFAULT_BABEL_URL,
    monacoLoader = {},
    monacoOptions = {},
    defaultRenderMode = 'playground',
  } = options || {};

  const playgroundVirtualModule = new RspackVirtualModulePlugin({});
  const getRouteMeta = () => routeMeta;

  if (render && !/Playground\.(jsx?|tsx?)$/.test(render)) {
    throw new Error(
      '[Playground]: render should ends with Playground.(jsx?|tsx?)',
    );
  }

  const preloads: string[] = [];
  const monacoPrefix = monacoLoader.paths?.vs || DEFAULT_MONACO_URL;
  preloads.push(normalizeUrl(`${monacoPrefix}/loader.js`));
  preloads.push(normalizeUrl(`${monacoPrefix}/editor/editor.main.js`));

  return {
    name: '@rspress/plugin-playground',
    config(config, { removePlugin }) {
      config.markdown = config.markdown || {};
      config.markdown.mdxRs = false;
      // The preview and playground plugin are mutually conflicting.
      removePlugin('@rspress/plugin-preview');
      return config;
    },
    async routeGenerated(routes: RouteMeta[]) {
      const { default: fs } = await import('@rspress/shared/fs-extra');

      // init routeMeta
      routeMeta = routes;

      const files = routes.map(route => route.absolutePath);

      const imports: Record<string, string> = {};

      // scan all demos, and generate imports
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

                const thisImports = parseImports(code, path.extname(demoPath));
                thisImports.forEach(x => {
                  if (typeof imports[x] === 'undefined') {
                    imports[x] = x;
                  }
                });
              }
            });

            visit(ast, 'code', (node: Code) => {
              if (node.lang === 'jsx' || node.lang === 'tsx') {
                const { value, meta } = node;
                const hasPureMeta = meta?.includes('pure');
                const hasPlaygroundMeta = meta?.includes('playground');

                let noTransform;
                switch (defaultRenderMode) {
                  case 'pure':
                    noTransform = !hasPlaygroundMeta;
                    break;
                  case 'playground':
                    noTransform = hasPureMeta;
                    break;
                  default:
                    break;
                }

                // do not anything for pure mode
                if (noTransform) {
                  return;
                }

                const thisImports = parseImports(value, node.lang);
                thisImports.forEach(x => {
                  if (typeof imports[x] === 'undefined') {
                    imports[x] = x;
                  }
                });
              }
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
        }),
      );

      if (include) {
        include.forEach(item => {
          if (typeof item === 'string') {
            imports[item] = item;
          } else {
            imports[item[0]] = item[1];
          }
        });
      }

      if (!('react' in imports)) {
        imports.react = 'react';
      }

      const importKeys = Object.keys(imports);
      const code = [
        ...importKeys.map(
          (x, index) => `import * as i_${index} from '${imports[x]}';`,
        ),
        'const imports = new Map();',
        ...importKeys.map((x, index) => `imports.set('${x}', i_${index});`),
        'function getImport(name, getDefault) {',
        '  if (!imports.has(name)) {',
        '    throw new Error("Module " + name + " not found");',
        '  }',
        '  const result = imports.get(name);',
        '  if (getDefault && typeof result === "object") {',
        '    return result.default || result;',
        '  }',
        '  return result;',
        '}',
        'export { imports };',
        'export default getImport;',
      ].join('\n');

      // console.log('playground-imports', code);

      playgroundVirtualModule.writeModule('_rspress_playground_imports', code);
    },
    builderConfig: {
      source: {
        define: {
          __PLAYGROUND_DIRECTION__: JSON.stringify(defaultDirection),
          __PLAYGROUND_MONACO_LOADER__: JSON.stringify(monacoLoader),
          __PLAYGROUND_MONACO_OPTIONS__: JSON.stringify(monacoOptions),
          __PLAYGROUND_BABEL_URL__: JSON.stringify(babelUrl),
        },
        include: [join(__dirname, '..', '..', '..')],
      },
      html: {
        tags: preloads.map(url => ({
          tag: 'link',
          head: true,
          attrs: {
            rel: 'preload',
            href: url,
            as: 'script',
          },
        })),
      },
      tools: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore
        rspack: {
          plugins: [playgroundVirtualModule],
        },
      },
    },
    markdown: {
      remarkPlugins: [
        [remarkPlugin, { getRouteMeta, editorPosition, defaultRenderMode }],
      ],
      globalComponents: [
        render
          ? render
          : path.join(staticPath, 'global-components', 'Playground.tsx'),
      ],
    },
    globalStyles: path.join(staticPath, 'global-styles', 'web.css'),
  };
}
