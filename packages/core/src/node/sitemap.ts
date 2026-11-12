import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import {
  type SitemapOptions,
  type UserConfig,
  withBase,
  withSiteOrigin,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { glob } from 'tinyglobby';
import type { RouteService } from './route/RouteService';
import { routePath2HtmlFileName } from './ssg/htmlFile';

export type ChangeFreq =
  'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export type Priority =
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

export interface Sitemap {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: Priority;
  [key: string]: string | undefined;
}

export interface CustomMaps {
  [routePath: string]: Sitemap;
}

export interface RobotsPolicy {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
  cleanParam?: string | string[];
}

export interface RobotsOptions {
  policies?: RobotsPolicy[];
  additionalSitemaps?: string[];
  includeSitemap?: boolean;
  host?: string;
  outputFileName?: string;
  mergeStrategy?: 'merge' | 'replace' | 'preserve';
  transform?: (content: string) => string | Promise<string>;
}

export interface LinkTagOptions {
  rel?: string;
  type?: string;
  href?: string;
}

export interface SitemapDiscoveryOptions {
  linkTag?: boolean | LinkTagOptions;
  robotsTxt?: boolean | RobotsOptions;
}

export interface PluginSitemapOptions extends SitemapOptions {
  discovery?: SitemapDiscoveryOptions;
}

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

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSitemapUrl(resolvedSiteUrl: string): string {
  return `${resolvedSiteUrl.replace(/\/$/, '')}/sitemap.xml`;
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

export function rsbuildPluginSitemap({
  config,
  routeService,
}: {
  config: UserConfig;
  routeService: Pick<RouteService, 'getRoutes'>;
}): RsbuildPlugin {
  const options = (
    typeof config.sitemap === 'object' ? config.sitemap : {}
  ) as PluginSitemapOptions;
  const cleanUrls = config.route?.cleanUrls ?? false;

  const discoveryConfig = options.discovery ?? {};
  const linkTagOption = discoveryConfig.linkTag ?? true;
  const robotsOption = discoveryConfig.robotsTxt ?? false;

  return {
    name: 'rspress:sitemap',
    setup(api) {
      let resolvedSiteUrl = '';

      if (linkTagOption) {
        api.modifyHTMLTags(({ headTags, bodyTags }, context) => {
          if (
            !resolvedSiteUrl ||
            (context?.environment?.name && context.environment.name !== 'web')
          ) {
            return { headTags, bodyTags };
          }
          const computedSitemapUrl = getSitemapUrl(resolvedSiteUrl);
          const linkOpts =
            typeof linkTagOption === 'object' ? linkTagOption : {};
          const sitemapHref = linkOpts.href || computedSitemapUrl;

          headTags.push({
            tag: 'link',
            attrs: {
              rel: linkOpts.rel || 'sitemap',
              type: linkOpts.type || 'application/xml',
              href: sitemapHref,
            },
          });

          return { headTags, bodyTags };
        });
      }

      api.modifyBundlerChain((_chain, { isProd, environment }) => {
        if (!isProd || environment.name !== 'web') return;
        resolvedSiteUrl = getSiteUrl(options.siteUrl, config);

        api.processAssets(
          { stage: 'additional', environments: ['web'] },
          async ({ compilation, sources }) => {
            if (compilation.errors.length) return;

            let hasPublicSitemap = false;
            for (const publicDir of api.getNormalizedConfig().server
              .publicDir) {
              if (publicDir.copyOnBuild === false) continue;
              const files = await glob('sitemap.xml', {
                cwd: publicDir.name,
                ignore: publicDir.ignore,
              });
              if (files.length) {
                hasPublicSitemap = true;
                logger.warn('[sitemap] Preserving public sitemap.xml.');
                break;
              }
            }

            if (!hasPublicSitemap) {
              const sitemaps: Sitemap[] = [];
              const seen = new Set<string>();
              for (const {
                routePath,
                absolutePath,
              } of routeService.getRoutes()) {
                if (seen.has(routePath)) continue;
                seen.add(routePath);
                const pathname = cleanUrls
                  ? routePath
                  : `/${routePath2HtmlFileName(routePath)}`;
                const encodedPath = pathname
                  .split('/')
                  .map(encodeURIComponent)
                  .join('/');
                sitemaps.push({
                  loc: `${resolvedSiteUrl.replace(/\/$/, '')}${encodedPath}`,
                  lastmod: (await stat(absolutePath)).mtime.toISOString(),
                  priority:
                    routePath === '/'
                      ? '1.0'
                      : (options.defaultPriority ?? '0.5'),
                  changefreq: options.defaultChangeFreq ?? 'monthly',
                  ...(options.customMaps?.[routePath] ?? {}),
                });
              }
              compilation.emitAsset(
                'sitemap.xml',
                new sources.RawSource(generateXml(sitemaps)),
              );
            }

            if (!robotsOption) return;

            const robotsConfig: RobotsOptions =
              typeof robotsOption === 'object' ? robotsOption : {};
            const fileName = robotsConfig.outputFileName || 'robots.txt';
            const mergeStrategy = robotsConfig.mergeStrategy || 'merge';

            if (mergeStrategy === 'preserve') {
              logger.info(
                `[sitemap] Preserving existing ${fileName} unchanged.`,
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
                  `[sitemap] Robots.txt requires an absolute URL for the Sitemap directive (RFC 9309). ` +
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
                    `[sitemap] Additional sitemap "${url}" is not an absolute URL and will be skipped in robots.txt.`,
                  );
                }
              }
            }

            let existingContent: string | null = null;
            for (const publicDir of api.getNormalizedConfig().server
              .publicDir) {
              if (publicDir.copyOnBuild === false) continue;
              const files = await glob(fileName, {
                cwd: publicDir.name,
                ignore: publicDir.ignore,
              });
              if (files.length) {
                try {
                  existingContent = await readFile(
                    resolve(publicDir.name, files[0]),
                    'utf-8',
                  );
                } catch {
                  // ignore
                }
                break;
              }
            }

            if (existingContent === null) {
              const existingAsset = compilation.getAsset(fileName);
              if (existingAsset) {
                existingContent = existingAsset.source.source().toString();
              }
            }

            const newline =
              existingContent && existingContent.includes('\r\n')
                ? '\r\n'
                : '\n';

            let finalContent: string;

            if (existingContent !== null && mergeStrategy === 'merge') {
              logger.info(
                `[sitemap] Safely updating existing ${fileName} with sitemap reference.`,
              );
              finalContent = reconcileRobotsTxt(
                existingContent,
                targetSitemaps,
                robotsConfig.policies,
                newline,
              );
            } else {
              logger.info(`[sitemap] Generating fresh ${fileName}.`);
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

            const source = new sources.RawSource(finalContent);
            if (compilation.getAsset(fileName)) {
              compilation.updateAsset(fileName, source);
            } else {
              compilation.emitAsset(fileName, source);
            }
          },
        );
      });
    },
  };
}
