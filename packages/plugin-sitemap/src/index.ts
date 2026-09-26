import { mkdir, stat, writeFile, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
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

export interface RobotsPolicy {
  /**
   * One or more user-agent identifiers (e.g. '*' or ['GPTBot', 'ClaudeBot']).
   */
  userAgent: string | string[];
  /**
   * Paths allowed to be crawled.
   */
  allow?: string | string[];
  /**
   * Paths forbidden from crawling.
   */
  disallow?: string | string[];
  /**
   * Optional crawl-delay directive in seconds.
   */
  crawlDelay?: number;
  /**
   * Optional clean-param directive (supported by Yandex).
   */
  cleanParam?: string | string[];
}

export interface RobotsOptions {
  /**
   * Crawl policies. If omitted, defaults to allowing all crawlers:
   * `[{ userAgent: '*', allow: '/' }]`
   */
  policies?: RobotsPolicy[];

  /**
   * Additional sitemap URLs to advertise in robots.txt.
   */
  additionalSitemaps?: string[];

  /**
   * Whether to include the generated sitemap.xml in robots.txt.
   * @default true
   */
  includeSitemap?: boolean;

  /**
   * Domain host directive (supported by Yandex and select search engines).
   */
  host?: string;

  /**
   * Output filename within the distribution root.
   * @default 'robots.txt'
   */
  outputFileName?: string;

  /**
   * Merge behavior when a robots.txt already exists (e.g. copied from public/):
   * - 'merge': Safely append missing sitemaps and policies without duplicates (default).
   * - 'replace': Overwrite the existing robots.txt completely.
   * - 'preserve': Keep the existing robots.txt completely unmodified.
   * @default 'merge'
   */
  mergeStrategy?: 'merge' | 'replace' | 'preserve';

  /**
   * Custom hook to synchronously or asynchronously transform final robots.txt content.
   */
  transform?: (content: string) => string | Promise<string>;
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
   */
  robotsTxt?: boolean | RobotsOptions;
}

export interface PluginSitemapOptions {
  siteUrl?: string;
  customMaps?: CustomMaps;
  defaultPriority?: Priority;
  defaultChangeFreq?: ChangeFreq;
  discovery?: SitemapDiscoveryOptions;
}
function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function serializeRobotsTxt(
  policies: RobotsPolicy[],
  sitemaps: string[],
  host?: string,
  newline: string = '\n',
): string {
  const lines: string[] = [];

  for (const policy of policies) {
    const agents = Array.isArray(policy.userAgent)
      ? policy.userAgent
      : [policy.userAgent];
    for (const agent of agents) {
      lines.push(`User-agent: ${agent}`);
    }

    if (policy.allow) {
      const allows = Array.isArray(policy.allow)
        ? policy.allow
        : [policy.allow];
      for (const allow of allows) {
        lines.push(`Allow: ${allow}`);
      }
    }

    if (policy.disallow) {
      const disallows = Array.isArray(policy.disallow)
        ? policy.disallow
        : [policy.disallow];
      for (const disallow of disallows) {
        lines.push(`Disallow: ${disallow}`);
      }
    }

    if (typeof policy.crawlDelay === 'number') {
      lines.push(`Crawl-delay: ${policy.crawlDelay}`);
    }

    if (policy.cleanParam) {
      const cleanParams = Array.isArray(policy.cleanParam)
        ? policy.cleanParam
        : [policy.cleanParam];
      for (const cp of cleanParams) {
        lines.push(`Clean-param: ${cp}`);
      }
    }

    lines.push('');
  }

  if (host) {
    lines.push(`Host: ${host}`);
    lines.push('');
  }

  for (const sitemap of sitemaps) {
    lines.push(`Sitemap: ${sitemap}`);
  }

  return lines.join(newline).trim() + newline;
}

function reconcileRobotsTxt(
  existingContent: string,
  missingSitemaps: string[],
  policies: RobotsPolicy[] | undefined,
  newline: string,
): string {
  const cleaned = existingContent.replace(/^\uFEFF/, '').trimEnd();

  if (!cleaned.trim()) {
    const defaultPolicies = policies ?? [{ userAgent: '*', allow: '/' }];
    return serializeRobotsTxt(
      defaultPolicies,
      missingSitemaps,
      undefined,
      newline,
    );
  }

  const additions: string[] = [];

  for (const sitemapUrl of missingSitemaps) {
    const pattern = new RegExp(
      `^\\s*sitemap:\\s*${escapeRegex(sitemapUrl)}\\s*$`,
      'im',
    );
    if (!pattern.test(cleaned)) {
      additions.push(`Sitemap: ${sitemapUrl}`);
    }
  }

  if (additions.length === 0) {
    return cleaned + newline;
  }

  return `${cleaned}${newline}${newline}${additions.join(newline)}${newline}`;
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
  const robotsOption = discoveryConfig.robotsTxt ?? false;

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
        const configPath = config.outDir || distPathRoot || 'doc_build';

        const outputDir = isAbsolute(configPath)
          ? configPath
          : resolve(process.cwd(), configPath);

        let outputPath = `./${configPath || 'doc_build'}/sitemap.xml`;
        if (isAbsolute(configPath || '')) {
          outputPath = `${configPath}/sitemap.xml`;
        }
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, generateXml(sitemaps));

        if (!robotsOption) return;

        const robotsConfig: RobotsOptions =
          typeof robotsOption === 'object' ? robotsOption : {};
        const fileName = robotsConfig.outputFileName || 'robots.txt';
        const robotsFilePath = resolve(outputDir, fileName);
        const mergeStrategy = robotsConfig.mergeStrategy || 'merge';

        if (mergeStrategy === 'preserve') {
          logger.info(
            `[plugin-sitemap] Preserving existing ${fileName} unchanged.`,
          );
          return;
        }

        const targetSitemaps: string[] = [];
        const computedSitemapUrl = getSitemapUrl(resolvedSiteUrl);

        if (robotsConfig.includeSitemap ?? true) {
          if (isAbsoluteUrl(computedSitemapUrl)) {
            targetSitemaps.push(computedSitemapUrl);
          } else {
            logger.warn(
              `[plugin-sitemap] Robots.txt requires an absolute URL for the Sitemap directive (RFC 9309). ` +
                `Resolved "${computedSitemapUrl}" is relative. Specify 'siteUrl' or 'siteOrigin' to enable sitemap injection.`,
            );
          }
        }

        if (robotsConfig.additionalSitemaps?.length) {
          for (const url of robotsConfig.additionalSitemaps) {
            if (isAbsoluteUrl(url)) {
              targetSitemaps.push(url);
            } else {
              logger.warn(
                `[plugin-sitemap] Additional sitemap "${url}" is not an absolute URL and will be skipped in robots.txt.`,
              );
            }
          }
        }

        let existingContent: string | null = null;
        try {
          existingContent = await readFile(robotsFilePath, 'utf-8');
        } catch (err: any) {
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }

        const newline =
          existingContent && existingContent.includes('\r\n') ? '\r\n' : '\n';

        let finalContent: string;

        if (existingContent !== null && mergeStrategy === 'merge') {
          logger.info(
            `[plugin-sitemap] Safely updating existing ${fileName} with sitemap reference.`,
          );
          finalContent = reconcileRobotsTxt(
            existingContent,
            targetSitemaps,
            robotsConfig.policies,
            newline,
          );
        } else {
          logger.info(`[plugin-sitemap] Generating fresh ${fileName}.`);
          const policies = robotsConfig.policies || [
            { userAgent: '*', allow: '/' },
          ];
          finalContent = serializeRobotsTxt(
            policies,
            targetSitemaps,
            robotsConfig.host,
            newline,
          );
        }

        if (typeof robotsConfig.transform === 'function') {
          finalContent = await robotsConfig.transform(finalContent);
        }
        await writeFile(robotsFilePath, finalContent, 'utf-8');
      }
    },
  };
}
