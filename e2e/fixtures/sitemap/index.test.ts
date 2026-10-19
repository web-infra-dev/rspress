import { execFile } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, expect, test } from '@rstest/core';

const appDir = import.meta.dirname;
const outputDirs = [
  'doc_build',
  'legacy-build',
  'disabled-build',
  'default-build',
  'unused-build',
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

const readSitemap = async (dir: string) => {
  const xml = await readFile(path.join(appDir, dir, 'sitemap.xml'), 'utf8');
  expect(
    await readFile(path.join(appDir, dir, 'sitemap-observed.xml'), 'utf8'),
  ).toBe(xml);
  return xml;
};

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
  expect(xml.match(/<url>/g)).toHaveLength(5);
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
  expect(xml).toContain('<loc>https://example.com/docs/folder/</loc>');
  expect(xml).toContain('<loc>https://example.com/docs/My%20Guide</loc>');
  await access(path.join(appDir, 'default-build', 'folder', 'index.html'));
  await access(path.join(appDir, 'default-build', 'My Guide.html'));
  expect(xml).toContain('<loc>https://example.com/docs/FAQ%231</loc>');
  await access(path.join(appDir, 'default-build', 'FAQ#1.html'));
  await expect(
    access(path.join(appDir, 'unused-build', 'sitemap.xml')),
  ).rejects.toThrow('ENOENT');
  expect(xml).toContain('<priority>0.5</priority>');
  expect(xml).toContain('<changefreq>monthly</changefreq>');
});

test('updates retained output in separate production builds', async () => {
  await build('rspress-default.config.ts');
  const pagePath = path.join(appDir, 'doc', 'next.md');
  await writeFile(pagePath, '# Next');
  try {
    await build('rspress-default.config.ts');
    expect(await readSitemap('default-build')).toContain(
      '<loc>https://example.com/docs/next</loc>',
    );
  } finally {
    await rm(pagePath, { force: true });
  }
});

test('preserves a user-provided public sitemap', async () => {
  const publicDir = path.join(appDir, 'doc', 'public');
  const content =
    '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://custom.example/</loc></url></urlset>';
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, 'sitemap.xml'), content);
  try {
    await build('rspress-default.config.ts');
    expect(await readSitemap('default-build')).toBe(content);
  } finally {
    await rm(path.join(publicDir, 'sitemap.xml'), { force: true });
  }
});
