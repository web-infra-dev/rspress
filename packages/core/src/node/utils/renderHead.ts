import type { FrontMatterMeta, RouteMeta, UserConfig } from '@rspress/shared';
import fsExtra from '@rspress/shared/fs-extra';
import { loadFrontMatter } from '@rspress/shared/node-utils';

export async function renderFrontmatterHead(route: any): Promise<string> {
  if (!isRouteMeta(route)) return '';
  const content = await fsExtra.readFile(route.absolutePath, {
    encoding: 'utf-8',
  });
  const {
    frontmatter: { head },
  } = loadFrontMatter<FrontMatterMeta>(content, route.absolutePath, '', true);
  if (!head || head.length === 0) return '';

  return head.map(([tag, attrs]) => `<${tag} ${renderAttrs(attrs)}}>`).join('');
}

export async function renderConfigHead(
  config: UserConfig,
  route: any,
): Promise<string> {
  if (!isRouteMeta(route)) return '';
  if (!config.head || config.head.length === 0) return '';

  return config.head
    .map(head => {
      if (typeof head === 'string') return head;
      if (typeof head === 'function') {
        const resultHead = head(route);
        if (!resultHead) return '';
        if (typeof resultHead === 'string') return resultHead;
        return `<${resultHead[0]} ${renderAttrs(resultHead[1])}>`;
      }
      return `<${head[0]} ${renderAttrs(head[1])}>`;
    })
    .join('');
}

function renderAttrs(attrs: FrontMatterMeta['head'][number][1]): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (typeof value === 'boolean') return key;
      if (typeof value === 'string' || typeof value === 'number')
        return `${key}="${value}"`;
      throw new Error(
        `Invalid value for attribute ${key}:${JSON.stringify(value)}`,
      );
    })
    .join('');
}

function isRouteMeta(route: any): route is RouteMeta {
  return 'routePath' in route && 'absolutePath' in route;
}
