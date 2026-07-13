import type { RouteMeta, UserConfig } from '@rspress/shared';

import {
  APP_HTML_MARKER,
  HEAD_MARKER,
  META_GENERATOR,
  RSPRESS_VERSION,
} from '../constants';
import type { RouteChunkAssetsManifest } from '../route/routeChunkAssets';
import { createError } from '../utils';
import type { AlternateLink } from './alternateLinks';

async function renderConfigHead(
  head: UserConfig['head'],
  route: RouteMeta,
): Promise<string> {
  if (!isRouteMeta(route)) return '';
  if (!head || head.length === 0) return '';

  return head
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

export async function renderHtmlTemplate(
  htmlTemplate: string,
  head: UserConfig['head'],
  route: RouteMeta,
  appHtml: string = '',
  alternateLinks: AlternateLink[] = [],
  routeChunkAssets?: RouteChunkAssetsManifest,
) {
  const alternateLinkTags = alternateLinks
    .map(
      ({ href, hrefLang }) =>
        `<link ${renderAttrs({ rel: 'alternate', hreflang: hrefLang, href })}>`,
    )
    .join('');
  const routePreloadLinks = renderRoutePreloadLinks(route, routeChunkAssets);
  const replacedHtmlTemplate = htmlTemplate
    // Don't use `string` as second param
    // To avoid some special characters transformed to the marker, such as `$&`, etc.
    .replace(APP_HTML_MARKER, () => appHtml)
    .replace(
      META_GENERATOR,
      () => `<meta name="generator" content="Rspress v${RSPRESS_VERSION}">`,
    )
    .replace(
      HEAD_MARKER,
      [
        routePreloadLinks,
        await renderConfigHead(head, route),
        alternateLinkTags,
      ].join(''),
    );
  return replacedHtmlTemplate;
}

function renderRoutePreloadLinks(
  route: RouteMeta,
  manifest?: RouteChunkAssetsManifest,
): string {
  if (!manifest) return '';

  const assets = manifest.assets[route.routePath];
  if (!assets) return '';

  return assets
    .map(asset => {
      const href = `${manifest.assetPrefix}${asset}`;
      return `<link rel="preload" href="${escapeHtmlAttribute(href)}" as="script">`;
    })
    .join('');
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderAttrs(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (typeof value === 'boolean') return key;
      if (typeof value === 'string' || typeof value === 'number')
        return `${key}="${value}"`;
      throw createError(
        `Invalid value for attribute ${key}:${JSON.stringify(value)}`,
      );
    })
    .join(' ');
}

function isRouteMeta(route: unknown): route is RouteMeta {
  return (
    !!route &&
    typeof route === 'object' &&
    'routePath' in route &&
    'absolutePath' in route
  );
}
