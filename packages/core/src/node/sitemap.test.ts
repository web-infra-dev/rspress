import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRsbuild, mergeRsbuildConfig } from '@rsbuild/core';
import type { RouteMeta, UserConfig } from '@rspress/shared';
import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { PluginDriver } from './PluginDriver';
import { rsbuildPluginSitemap } from './sitemap';

let directory: string;
let filepath: string;
let outDir: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'rspress-sitemap-'));
  filepath = path.join(directory, 'index.md');
  outDir = path.join(directory, 'output');
  await writeFile(filepath, '# Home');
  await writeFile(path.join(directory, 'entry.js'), '');
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function route(routePath: string): RouteMeta {
  return { routePath, absolutePath: filepath } as RouteMeta;
}

async function generate(
  config: UserConfig = {},
  isProd = true,
  routes = ['/', '/guide', '/guide'],
) {
  const driver = await PluginDriver.create(
    { mediumZoom: false, root: directory, outDir, ...config },
    isProd,
  );
  const resolved = await driver.modifyConfig();
  const routeService = { getRoutes: () => routes.map(route) };
  const rsbuild = await createRsbuild({
    rsbuildConfig: mergeRsbuildConfig(
      {
        plugins: [
          resolved.sitemap
            ? rsbuildPluginSitemap({ config: resolved, routeService })
            : null,
        ],
        mode: isProd ? 'production' : 'development',
        logLevel: 'silent',
        source: { entry: { index: path.join(directory, 'entry.js') } },
        server: { publicDir: { name: path.join(directory, 'public') } },
        environments: { web: { output: { distPath: resolved.outDir } } },
      },
      ...driver.getPlugins().map(plugin => plugin.builderConfig ?? {}),
      resolved.builderConfig ?? {},
    ),
  });
  await rsbuild.build();
  return { routeService, rsbuild };
}

const readSitemap = () => readFile(path.join(outDir, 'sitemap.xml'), 'utf8');

describe('built-in sitemap', () => {
  it('generates one entry per route using siteOrigin and base', async () => {
    await generate({
      sitemap: true,
      siteOrigin: 'https://example.com',
      base: '/docs/',
    });
    const xml = await readSitemap();
    expect(xml).toContain('<loc>https://example.com/docs/</loc>');
    expect(xml).toContain('<loc>https://example.com/docs/guide</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).toContain(
      '<lastmod>' + (await stat(filepath)).mtime.toISOString() + '</lastmod>',
    );
    expect(xml).toContain('<priority>1.0</priority>');
    expect(xml).toContain('<priority>0.5</priority>');
    expect(xml).toContain('<changefreq>monthly</changefreq>');
  });

  it('generates a sitemap by default', async () => {
    await generate({ siteOrigin: 'https://example.com' });
    expect(await readSitemap()).toContain(
      '<loc>https://example.com/guide</loc>',
    );
  });

  it('does not emit when sitemap is false', async () => {
    await generate({ sitemap: false });
    await expect(readSitemap()).rejects.toThrow('ENOENT');
  });

  it.each([true, { siteUrl: 'invalid' }])(
    'does not initialize or emit during development: %j',
    async sitemap => {
      await generate({ sitemap }, false);
      await expect(readSitemap()).rejects.toThrow('ENOENT');
    },
  );

  it('preserves relative URLs when no origin is configured', async () => {
    await generate({ sitemap: {}, base: '/docs/' });
    expect(await readSitemap()).toContain('<loc>/docs/guide</loc>');
  });

  it.each(['https://custom.example/base', 'https://custom.example/base/'])(
    'uses the explicit siteUrl %s and custom entry options',
    async siteUrl => {
      await generate({
        siteOrigin: 'https://example.com',
        base: '/docs/',
        sitemap: {
          siteUrl,
          defaultPriority: '0.8',
          defaultChangeFreq: 'weekly',
          customMaps: {
            '/': {
              loc: 'https://custom.example/home',
              lastmod: '2026-01-01',
              priority: '0.9',
              changefreq: 'daily',
            },
          },
        },
      });
      const xml = await readSitemap();
      expect(xml).toContain('<loc>https://custom.example/base/guide</loc>');
      expect(xml).toContain(
        '<priority>0.8</priority><changefreq>weekly</changefreq>',
      );
      expect(xml).toContain(
        '<loc>https://custom.example/home</loc><lastmod>2026-01-01</lastmod><priority>0.9</priority><changefreq>daily</changefreq>',
      );
    },
  );

  it.each(['string', 'object'])(
    'uses builderConfig.output.distPath as %s',
    async form => {
      await generate({
        sitemap: true,
        outDir: undefined,
        builderConfig: {
          output: { distPath: form === 'string' ? outDir : { root: outDir } },
        },
      });
      expect(await readSitemap()).toContain('<loc>/guide</loc>');
    },
  );

  it('uses the resolved web output directory and supports relative paths', async () => {
    await generate({
      sitemap: true,
      outDir: path.join(directory, 'unused'),
      builderConfig: {
        environments: {
          web: { output: { distPath: path.relative(process.cwd(), outDir) } },
        },
      },
    });
    expect(await readSitemap()).toContain('<loc>/guide</loc>');
  });

  it('uses sitemap options set by a plugin config hook', async () => {
    await generate({
      plugins: [
        {
          name: 'enable-sitemap',
          config: config => ({
            ...config,
            sitemap: { siteUrl: 'https://plugin.example' },
          }),
        },
      ],
    });
    expect(await readSitemap()).toContain(
      '<loc>https://plugin.example/guide</loc>',
    );
  });

  it('reads the current routes on each build', async () => {
    const { routeService, rsbuild } = await generate({ sitemap: true });
    routeService.getRoutes = () => [route('/next')];
    await rsbuild.build();
    const xml = await readSitemap();
    expect(xml).toContain('<loc>/next</loc>');
    expect(xml).not.toContain('<loc>/guide</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(1);
  });

  it.each([
    [false, ['/index.html', '/guide.html', '/folder/index.html']],
    [true, ['/', '/guide', '/folder/']],
  ] as const)(
    'uses canonical paths with cleanUrls=%s',
    async (cleanUrls, paths) => {
      await generate(
        { siteOrigin: 'https://example.com', route: { cleanUrls } },
        true,
        ['/', '/guide', '/folder/'],
      );
      const xml = await readSitemap();
      for (const route of paths)
        expect(xml).toContain(`<loc>https://example.com${route}</loc>`);
    },
  );

  it.each([false, true])(
    'encodes file paths with cleanUrls=%s',
    async cleanUrls => {
      await generate(
        {
          sitemap: { siteUrl: 'https://example.com/my%20docs/' },
          route: { cleanUrls },
        },
        true,
        [
          '/My Guide',
          '/指南',
          '/literal%20text',
          '/FAQ#1',
          '/what?1',
          '/100%',
          '/folder#1/',
        ],
      );
      const xml = await readSitemap();
      const paths = [
        'My%20Guide',
        '%E6%8C%87%E5%8D%97',
        'literal%2520text',
        'FAQ%231',
        'what%3F1',
        '100%25',
        'folder%231/',
      ];
      for (const route of paths) {
        const suffix = cleanUrls
          ? ''
          : route.endsWith('/')
            ? 'index.html'
            : '.html';
        expect(xml).toContain(
          `<loc>https://example.com/my%20docs/${route}${suffix}</loc>`,
        );
      }
    },
  );

  it('escapes XML text while preserving custom URLs', async () => {
    await generate({
      sitemap: {
        customMaps: {
          '/guide': { loc: `https://example.com/?q=<docs>&name="guide's"` },
        },
      },
    });
    expect(await readSitemap()).toContain(
      '<loc>https://example.com/?q=&lt;docs&gt;&amp;name=&quot;guide&#39;s&quot;</loc>',
    );
  });

  it('preserves a sitemap copied from public', async () => {
    await mkdir(path.join(directory, 'public'), { recursive: true });
    await writeFile(
      path.join(directory, 'public/sitemap.xml'),
      '<manual-sitemap />',
    );
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, 'sitemap.xml'), '<manual-sitemap />');
    await generate();
    expect(await readSitemap()).toBe('<manual-sitemap />');
  });

  it('preserves public output that replaces a previously generated sitemap', async () => {
    const { rsbuild } = await generate();
    await mkdir(path.join(directory, 'public'), { recursive: true });
    await writeFile(
      path.join(directory, 'public/sitemap.xml'),
      '<manual-sitemap />',
    );
    await writeFile(path.join(outDir, 'sitemap.xml'), '<manual-sitemap />');
    await rsbuild.build();
    expect(await readSitemap()).toBe('<manual-sitemap />');
  });

  it.each([{ copyOnBuild: false }, { ignore: ['*.xml'] }])(
    'generates when the public sitemap is not copied: %j',
    async publicOptions => {
      const publicDir = path.join(directory, 'custom-public');
      await mkdir(publicDir);
      await writeFile(
        path.join(publicDir, 'sitemap.xml'),
        '<manual-sitemap />',
      );
      await generate({
        builderConfig: {
          server: { publicDir: { name: publicDir, ...publicOptions } },
        },
      });
      expect(await readSitemap()).toContain('/guide');
    },
  );

  it('regenerates retained output across separate builds', async () => {
    await generate();
    await generate({}, true, ['/next']);
    const xml = await readSitemap();
    expect(xml).toContain('<loc>/next</loc>');
    expect(xml).not.toContain('/guide');
  });

  it.each([
    'https://example.com/docs?lang=en',
    'https://example.com/docs#top',
    'https://example.com/docs?',
    'https://example.com/docs#',
    'ftp://example.com/docs',
  ])('rejects unsupported site URL %s', async siteUrl => {
    await expect(generate({ sitemap: { siteUrl } })).rejects.toThrow(
      'absolute HTTP(S) URL without a query or fragment',
    );
  });

  it('rejects invalid explicit site URLs', async () => {
    await expect(generate({ sitemap: { siteUrl: 'invalid' } })).rejects.toThrow(
      '`sitemap.siteUrl`',
    );
  });

  it('rejects invalid site origins', async () => {
    await expect(
      generate({ sitemap: true, siteOrigin: 'invalid' }),
    ).rejects.toThrow('`siteOrigin`');
  });
});
