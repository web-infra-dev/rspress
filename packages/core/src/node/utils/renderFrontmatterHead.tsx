import type { FrontMatterMeta, RouteMeta } from '@rspress/shared';
import fsExtra from '@rspress/shared/fs-extra';
import { loadFrontMatter } from '@rspress/shared/node-utils';

export default async function renderFrontmatterHead(
  route: any,
): Promise<string> {
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
