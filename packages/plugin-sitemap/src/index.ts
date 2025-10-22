import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute } from 'node:path';
import { logger, type RspressPlugin } from '@rspress/core';

type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

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

export interface PluginSitemapOptions {
  siteUrl: string;
  customMaps?: CustomMaps;
  defaultPriority?: Priority;
  defaultChangeFreq?: ChangeFreq;
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

export function pluginSitemap(options: PluginSitemapOptions): RspressPlugin {
  const {
    siteUrl,
    customMaps = {},
    defaultChangeFreq = 'monthly',
    defaultPriority = '0.5',
  } = options;
  const sitemaps: Sitemap[] = [];
  const set = new Set();
  return {
    name: '@rspress/plugin-sitemap',
    async extendPageData(pageData, isProd) {
      if (isProd) {
        if (!set.has(pageData.routePath)) {
          set.add(pageData.routePath);
          sitemaps.push({
            // @ts-expect-error
            loc: `${siteUrl.replace(/\/$/, '')}${pageData.routePath}`,
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
        const configPath =
          config.outDir || config.builderConfig?.output?.distPath?.root;
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
