import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PageIndexInfo, UserConfig } from '@rspress/shared';
import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { PluginDriver } from './PluginDriver';

let directory: string;
let filepath: string;
let outDir: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'rspress-sitemap-'));
  filepath = path.join(directory, 'index.md');
  outDir = path.join(directory, 'output');
  await writeFile(filepath, '# Home');
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function page(routePath: string): PageIndexInfo {
  return { routePath, _filepath: filepath } as PageIndexInfo;
}

async function generate(config: UserConfig = {}, isProd = true) {
  const driver = await PluginDriver.create(
    { mediumZoom: false, outDir, ...config },
    isProd,
  );
  await driver.modifyConfig();
  await driver.beforeBuild();
  await Promise.all(
    ['/', '/guide', '/guide'].map(route => driver.extendPageData(page(route))),
  );
  await driver.afterBuild();
  return driver;
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

  it('does not emit during development', async () => {
    await generate({ sitemap: true }, false);
    await expect(readSitemap()).rejects.toThrow('ENOENT');
  });

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

  it('gives outDir precedence and supports relative paths', async () => {
    await generate({
      sitemap: true,
      outDir: path.relative(process.cwd(), outDir),
      builderConfig: { output: { distPath: path.join(directory, 'unused') } },
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

  it('clears collected pages before the next build', async () => {
    const driver = await generate({ sitemap: true });
    await driver.beforeBuild();
    await driver.extendPageData(page('/next'));
    await driver.afterBuild();
    const xml = await readSitemap();
    expect(xml).toContain('<loc>/next</loc>');
    expect(xml).not.toContain('<loc>/guide</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(1);
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
