import { execFile } from 'node:child_process';
import { access, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, expect, test } from '@rstest/core';

const appDir = import.meta.dirname;
const outputDirs = [
  'doc_build',
  'legacy-build',
  'disabled-build',
  'default-build',
];

async function build(config: string) {
  return promisify(execFile)(
    process.execPath,
    ['--run', 'build', '--', '-c', config],
    {
      cwd: appDir,
      env: { ...process.env, RSPRESS_PERSISTENT_CACHE: 'false' },
    },
  );
}

const readSitemap = (dir: string) =>
  readFile(path.join(appDir, dir, 'sitemap.xml'), 'utf8');

afterAll(async () => {
  await Promise.all(
    outputDirs.map(dir =>
      rm(path.join(appDir, dir), { recursive: true, force: true }),
    ),
  );
});

test('core and legacy configurations emit the same sitemap in SSG and CSR builds', async () => {
  await build('rspress.config.ts');
  const xml = await readSitemap('doc_build');
  expect(xml.match(/<url>/g)).toHaveLength(2);
  expect(xml).toContain(
    '<loc>https://example.com/docs/</loc><lastmod>2026-01-01</lastmod><priority>1.0</priority><changefreq>weekly</changefreq>',
  );
  expect(xml).toContain('<loc>https://example.com/docs/guide</loc>');
  expect(xml).toContain('<priority>0.7</priority>');

  const { stdout, stderr } = await build('rspress-legacy.config.ts');
  expect(stdout + stderr).toContain(
    '@rspress/plugin-sitemap is a legacy plugin',
  );
  const legacyXml = await readSitemap('legacy-build');
  expect(legacyXml.match(/<url>.*?<\/url>/g)?.sort()).toEqual(
    xml.match(/<url>.*?<\/url>/g)?.sort(),
  );
});

test('sitemap false suppresses generation even with the legacy plugin', async () => {
  await build('rspress-disabled.config.ts');
  await expect(
    access(path.join(appDir, 'disabled-build', 'sitemap.xml')),
  ).rejects.toThrow('ENOENT');
});

test('production builds generate a sitemap by default', async () => {
  await build('rspress-default.config.ts');
  const xml = await readSitemap('default-build');
  expect(xml).toContain('<loc>https://example.com/docs/guide</loc>');
  expect(xml).toContain('<priority>0.5</priority>');
  expect(xml).toContain('<changefreq>monthly</changefreq>');
});
