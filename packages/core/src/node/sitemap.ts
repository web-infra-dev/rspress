import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute } from 'node:path';
import {
  type RspressPlugin,
  type SitemapOptions,
  type UserConfig,
  withBase,
  withSiteOrigin,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';

function ensureTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`;
}

function normalizeSiteUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    url.pathname = ensureTrailingSlash(url.pathname);
    return url.href;
  } catch {
    throw new Error(
      '[sitemap] `sitemap.siteUrl` must be a valid absolute URL with protocol, such as `https://example.com/base/`.',
    );
  }
}

function getSiteUrl(siteUrl: string | undefined, config: UserConfig) {
  if (siteUrl) {
    return normalizeSiteUrl(siteUrl);
  }
  const base = withBase('/', config.base ?? '/');
  try {
    return config.siteOrigin ? withSiteOrigin(base, config.siteOrigin) : base;
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
    result += `<${tag}>${value}</${tag}>`;
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
  return {
    name: 'rspress:sitemap',
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
      }
    },
    async extendPageData(pageData, isProd) {
      if (isProd && options) {
        if (!set.has(pageData.routePath)) {
          set.add(pageData.routePath);
          sitemaps.push({
            loc: `${resolvedSiteUrl.replace(/\/$/, '')}${pageData.routePath}`,
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
    async afterBuild(config, isProd) {
      if (isProd && options) {
        const distPathRoot =
          typeof config.builderConfig?.output?.distPath === 'string'
            ? config.builderConfig?.output?.distPath
            : config.builderConfig?.output?.distPath?.root;
        const configPath = config.outDir || distPathRoot;
        let outputPath = `./${configPath || 'doc_build'}/sitemap.xml`;
        if (isAbsolute(configPath || '')) {
          outputPath = `${configPath}/sitemap.xml`;
        }
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, generateXml(sitemaps));
      }
    },
  };
}
