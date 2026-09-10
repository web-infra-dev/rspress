import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { upgrade } from '@scalar/openapi-upgrader';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import type { RspressPlugin } from '@rspress/core';
import { getOperations } from '../model';
import { HTTP_METHODS, type OpenAPIDocument } from '../types';

export interface PluginOpenAPIOptions {
  /** Local JSON/YAML file (relative to cwd), URL, or an OpenAPI document. */
  input: string | OpenAPIDocument;
  /** Allow localhost and private network URLs when loading specifications. @default false */
  allowPrivateUrls?: boolean;
  /** URL prefix for generated pages. @default '/api' */
  routePrefix?: string;
  /** Generate a sidebar under routePrefix. @default true */
  sidebar?: boolean;
  /** Show the browser request playground. @default true */
  playground?: boolean;
}
export function pluginOpenAPI(options: PluginOpenAPIOptions): RspressPlugin {
  const prefix = `/${(options.routePrefix ?? 'api').replace(/^\/+|\/+$/g, '')}`;
  if (!/^\/[\w/-]+$/.test(prefix) || prefix.split('/').includes('..'))
    throw new Error('Invalid OpenAPI routePrefix.');
  let document: OpenAPIDocument;
  let pages: { routePath: string; content: string }[] = [];
  return {
    name: '@rspress/plugin-openapi',
    globalStyles: fileURLToPath(
      new URL('../../static/style.css', import.meta.url),
    ),
    async config(config) {
      const input =
        typeof options.input === 'string'
          ? /^https?:\/\//.test(options.input)
            ? options.input
            : path.resolve(options.input)
          : structuredClone(options.input);
      const bundled = await $RefParser.bundle(input, {
        resolve: { http: { safeUrlResolver: !options.allowPrivateUrls } },
      });
      document = upgrade(
        bundled as Record<string, unknown>,
        '3.1',
      ) as unknown as OpenAPIDocument;
      // Relative server URLs in remote documents resolve against the document URL.
      if (typeof input === 'string' && /^https?:\/\//.test(input)) {
        document.servers ??= [{ url: '/' }];
        const normalizeServers = (servers: OpenAPIDocument['servers']) => {
          for (const server of servers ?? []) {
            if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(server.url)) {
              server.url = new URL(server.url, input).href
                .replace(/%7B/gi, '{')
                .replace(/%7D/gi, '}');
            }
          }
        };
        normalizeServers(document.servers);
        for (const item of Object.values(document.paths)) {
          normalizeServers(item.servers);
          for (const method of HTTP_METHODS)
            normalizeServers(item[method]?.servers);
        }
      }
      const operations = getOperations(document);
      const slugs = new Set<string>();
      const groups = new Map<
        string,
        { text: string; link: string; tag: string }[]
      >();
      pages = operations.map(data => {
        const slug = data.id
          .replace(/[^a-zA-Z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase();
        if (!slug || slugs.has(slug))
          throw new Error(
            `Conflicting OpenAPI route for operation: ${data.id}`,
          );
        slugs.add(slug);
        const routePath = `${prefix}/${slug}`;
        const title = data.operation.summary || data.id;
        const tag = data.operation.tags?.[0] ?? document.info.title;
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push({
          text: title,
          link: routePath,
          tag: data.method.toUpperCase(),
        });
        // JSON string props prevent schema descriptions from becoming executable MDX.
        const props = JSON.stringify(
          JSON.stringify({
            document,
            operationId: data.id,
            showTitle: false,
            playground: options.playground !== false,
          }),
        );
        return {
          routePath,
          content: `---\ntitle: ${JSON.stringify(title)}\npageType: doc-wide\noutline: false\n---\n\nimport { APIReference } from '@rspress/plugin-openapi/web';\n\n<APIReference {...JSON.parse(${props})} />\n`,
        };
      });
      if (options.sidebar !== false) {
        config.themeConfig ??= {};
        config.themeConfig.sidebar = {
          ...config.themeConfig.sidebar,
          [`${prefix}/`]: [...groups].map(([text, items]) => ({ text, items })),
        };
      }
      return config;
    },
    addPages() {
      return pages;
    },
  };
}
export type { OpenAPIDocument } from '../types';
