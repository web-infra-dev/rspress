import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute } from 'node:path';
import {
  logger,
  type RspressPlugin,
  type UserConfig,
  withBase,
  withSiteOrigin,
} from '@rspress/core';

type ChangeFreq =
  'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

type Priority =
  | '0.0'
  | '0.1'
  | '0.2'
  | '0.3'
  | '0.4'
  | '0.5'
  | '0.6'
  | '0.7'
  | '0.8'
  | '0.9'
  | '1.0';

// https://www.sitemaps.org/protocol.html
interface Sitemap {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: Priority;
}

interface CustomMaps {
  [routePath: string]: Sitemap;
}

export interface LinkTagOptions {
  /**
   * Relationship attribute.
   * @default 'sitemap'
   */
  rel?: string;
  /**
   * MIME type attribute.
   * @default 'application/xml'
   */
  type?: string;
  /**
   * Explicitly override the sitemap href.
   */
  href?: string;
}

interface SitemapDiscoveryOptions {
  /**
   * Injects `<link rel="sitemap" ... />` into the HTML `<head>`.
   * Pass `true` for standard tag or an object for customization.
   * @default true
   */
  linkTag?: boolean | LinkTagOptions;

  /**
   * Generates or safely updates `robots.txt` referencing the sitemap.
   * Pass `true` for standard robots.txt or an object for custom policies.
   * @default false
   * @todo Feature not yet implemented. This option currently has no effect.
   */
  robots?: boolean;
}

export interface PluginSitemapOptions {
  siteUrl?: string;
  customMaps?: CustomMaps;
  defaultPriority?: Priority;
  defaultChangeFreq?: ChangeFreq;
  discovery?: SitemapDiscoveryOptions;
}

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
      '[plugin-sitemap] `siteUrl` must be a valid absolute URL with protocol, such as `https://example.com/base/`.',
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
      '[plugin-sitemap] `siteOrigin` in rspress.config.ts must be a valid absolute URL origin with protocol, such as `https://example.com`.',
    );
  }
}

function getSitemapUrl(resolvedSiteUrl: string): string {
  return `${resolvedSiteUrl.replace(/\/$/, '')}/sitemap.xml`;
}

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

export function pluginSitemap(
  options: PluginSitemapOptions = {},
): RspressPlugin {
  const {
    siteUrl,
    customMaps = {},
    defaultChangeFreq = 'monthly',
    defaultPriority = '0.5',
  } = options;

  const discoveryConfig = options.discovery ?? {};
  const linkTagOption = discoveryConfig.linkTag ?? true;

  const sitemaps: Sitemap[] = [];
  const set = new Set();
  let resolvedSiteUrl = '';
  return {
    name: '@rspress/plugin-sitemap',
    config(config) {
      resolvedSiteUrl = getSiteUrl(siteUrl, config);

      if (!linkTagOption) {
        return config;
      }

      const computedSitemapUrl = getSitemapUrl(resolvedSiteUrl);
      const linkOpts = typeof linkTagOption === 'object' ? linkTagOption : {};
      const sitemapHref = linkOpts.href || computedSitemapUrl;

      const tag = {
        tag: 'link',
        attrs: {
          rel: linkOpts.rel || 'sitemap',
          type: linkOpts.type || 'application/xml',
          href: sitemapHref,
        },
      };

      const existingTags = config.builderConfig?.html?.tags;
      const mergedTags = Array.isArray(existingTags)
        ? [...existingTags, tag]
        : existingTags
          ? [existingTags, tag]
          : [tag];

      return {
        ...config,
        builderConfig: {
          ...config.builderConfig,
          html: {
            ...config.builderConfig?.html,
            tags: mergedTags as any,
          },
        },
      };
    },
    beforeBuild(config, isProd) {
      if (isProd) {
        resolvedSiteUrl = getSiteUrl(siteUrl, config);
      }
    },

    async extendPageData(pageData, isProd) {
      if (isProd) {
        if (!set.has(pageData.routePath)) {
          set.add(pageData.routePath);
          sitemaps.push({
            // @ts-expect-error
            loc: `${resolvedSiteUrl.replace(/\/$/, '')}${pageData.routePath}`,
            lastmod: (await stat(pageData._filepath)).mtime.toISOString(),
            priority: pageData.routePath === '/' ? '1.0' : defaultPriority,
            changefreq: defaultChangeFreq,
            ...(customMaps?.[pageData.routePath] ?? {}),
          });
        }
      }
    },
    async afterBuild(config, isProd) {
      if (isProd) {
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
