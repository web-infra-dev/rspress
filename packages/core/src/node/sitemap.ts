import { stat } from 'node:fs/promises';
import type { RsbuildPluginAPI } from '@rsbuild/core';
import {
  type RspressPlugin,
  type SitemapOptions,
  type UserConfig,
  withBase,
  withSiteOrigin,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { glob } from 'tinyglobby';
import { routePath2HtmlFileName } from './ssg/htmlFile';

function ensureTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`;
}

function normalizeSiteUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.href.includes('?') ||
      url.href.includes('#')
    ) {
      throw new Error('Expected an HTTP(S) URL without a query or fragment.');
    }
    url.pathname = ensureTrailingSlash(url.pathname);
    return url.href;
  } catch {
    throw new Error(
      '[sitemap] `sitemap.siteUrl` must be an absolute HTTP(S) URL without a query or fragment, such as `https://example.com/base/`.',
    );
  }
}

function getSiteUrl(siteUrl: string | undefined, config: UserConfig) {
  if (siteUrl) {
    return normalizeSiteUrl(siteUrl);
  }
  const base = withBase('/', config.base ?? '/');
  try {
    return config.siteOrigin
      ? withSiteOrigin(base, config.siteOrigin)
      : encodeURI(base);
  } catch {
    throw new Error(
      '[sitemap] `siteOrigin` in rspress.config.ts must be a valid absolute URL origin with protocol, such as `https://example.com`.',
    );
  }
}

type Sitemap = NonNullable<SitemapOptions['customMaps']>[string];

const generateNode = (sitemap: Sitemap): string => {
  let result = '<url>';
  for (const [tag, value] of Object.entries(sitemap)) {
    const escaped = String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
    result += `<${tag}>${escaped}</${tag}>`;
  }
  result += '</url>';
  return result;
};

const generateXml = (sitemaps: Sitemap[]) => {
  logger.info(`Generate sitemap.xml for ${sitemaps.length} pages.`);
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps.reduce(
    (node, sitemap) => node + generateNode(sitemap),
    '',
  )}</urlset>`;
};

export function pluginSitemap(): RspressPlugin {
  let options: SitemapOptions | undefined;
  const sitemaps: Sitemap[] = [];
  const set = new Set<string>();
  let resolvedSiteUrl = '';
  let cleanUrls = false;
  return {
    name: 'rspress:sitemap',
    builderConfig: {
      plugins: [
        {
          name: 'rspress:sitemap-output',
          setup(api: RsbuildPluginAPI) {
            api.processAssets(
              { stage: 'additional', environments: ['web'] },
              async ({ compilation, sources }) => {
                if (!options || compilation.errors.length) return;
                for (const publicDir of api.getNormalizedConfig().server
                  .publicDir) {
                  if (publicDir.copyOnBuild === false) continue;
                  const files = await glob('sitemap.xml', {
                    cwd: publicDir.name,
                    ignore: publicDir.ignore,
                  });
                  if (files.length) {
                    logger.warn('[sitemap] Preserving public sitemap.xml.');
                    return;
                  }
                }
                compilation.emitAsset(
                  'sitemap.xml',
                  new sources.RawSource(generateXml(sitemaps)),
                );
              },
            );
          },
        },
      ],
    },
    beforeBuild(config, isProd) {
      sitemaps.length = 0;
      set.clear();
      options =
        isProd && config.sitemap
          ? typeof config.sitemap === 'object'
            ? config.sitemap
            : {}
          : undefined;
      if (options) {
        resolvedSiteUrl = getSiteUrl(options.siteUrl, config);
        cleanUrls = config.route?.cleanUrls ?? false;
      }
    },
    async extendPageData(pageData, isProd) {
      if (isProd && options) {
        if (!set.has(pageData.routePath)) {
          set.add(pageData.routePath);
          // Routes are file paths, not URLs: encode reserved characters as data.
          const pathname = cleanUrls
            ? pageData.routePath
            : `/${routePath2HtmlFileName(pageData.routePath)}`;
          const encodedPath = pathname
            .split('/')
            .map(encodeURIComponent)
            .join('/');
          sitemaps.push({
            loc: `${resolvedSiteUrl.replace(/\/$/, '')}${encodedPath}`,
            lastmod: (await stat(pageData._filepath)).mtime.toISOString(),
            priority:
              pageData.routePath === '/'
                ? '1.0'
                : (options.defaultPriority ?? '0.5'),
            changefreq: options.defaultChangeFreq ?? 'monthly',
            ...(options.customMaps?.[pageData.routePath] ?? {}),
          });
        }
      }
    },
  };
}
