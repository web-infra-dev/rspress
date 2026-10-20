import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PerformanceConfig } from '@rsbuild/core';
import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { createBuildReport } from './index';

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'rspress-build-report-'));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function environment(
  root: string,
  printFileSize: NonNullable<PerformanceConfig['printFileSize']> = {
    detail: false,
    compressed: true,
  },
) {
  return { output: { distPath: { root } }, performance: { printFileSize } };
}

async function page(name: string, size: number) {
  const filename = path.join(directory, name);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, Buffer.alloc(size));
}

const routes = (...routePaths: string[]) =>
  routePaths.map(routePath => ({ routePath }));

describe('createBuildReport', () => {
  it('reads final pages across environments, including worker output and 404', async () => {
    await page('html/index.html', 1000);
    await page('html/guide/index.html', 2000);
    await page('html/404.html', 500);
    await page('markdown/index.md', 100);
    await page('markdown/guide/index.md', 200);
    await page('html/stale.html', 10000);

    const report = await createBuildReport({
      rootPath: directory,
      environments: {
        web: environment('client'),
        node: environment('html'),
        node_md: environment('markdown'),
      },
      routes: routes('/', '/guide/', '/guide/'),
    });

    expect(report).toMatchInlineSnapshot(`
      "Page (raw size)     HTML  Markdown
      /                 3.5 kB   0.30 kB
      ├─ guide/         2.0 kB   0.20 kB
      │  └─ index       2.0 kB   0.20 kB
      ├─ index          1.0 kB   0.10 kB
      └─ 404           0.50 kB         -"
    `);
    expect(report).not.toContain('stale');
  });

  it('uses web HTML for CSR and omits the Markdown column when disabled', async () => {
    await page('client/index.html', 1234);
    const report = await createBuildReport({
      rootPath: directory,
      environments: { web: environment('client') },
      routes: routes('/'),
    });

    expect(report).toContain('1.2 kB');
    expect(report).toContain('HTML');
    expect(report).not.toContain('Markdown');
  });

  it.each([
    false,
    true,
    { detail: true },
    { detail: false, total: false },
    { detail: false, total: () => 'Custom summary' },
    { detail: false, diff: true },
  ])('preserves an explicit Rsbuild reporter: %j', async printFileSize => {
    await page('index.html', 1000);
    expect(
      await createBuildReport({
        rootPath: directory,
        environments: { web: environment(directory, printFileSize) },
        routes: routes('/'),
      }),
    ).toBe('');
  });

  it('respects reporting options for each environment', async () => {
    await page('html/index.html', 1000);
    await page('markdown/index.md', 100);
    const report = await createBuildReport({
      rootPath: directory,
      environments: {
        web: environment('client'),
        node: environment('html', false),
        node_md: environment('markdown'),
      },
      routes: routes('/'),
    });

    expect(report).toContain('Markdown');
    expect(report).toContain('0.10 kB');
    expect(report).not.toContain('HTML');
  });

  it('applies include and exclude to the emitted asset names and sizes', async () => {
    await page('html/guide/index.html', 1000);
    await page('html/guide/start.html', 2000);
    await page('html/other.html', 3000);
    const report = await createBuildReport({
      rootPath: directory,
      environments: {
        node: environment('html', {
          detail: false,
          include: asset => asset.name.startsWith('guide/'),
          exclude: asset => asset.size < 1500,
        }),
      },
      routes: routes('/guide/', '/guide/start', '/other'),
    });

    expect(report).toContain('start');
    expect(report).toContain('2.0 kB');
    expect(report).not.toContain('index');
    expect(report).not.toContain('other');
  });

  it('reads locale and version routes without adding the deployment base', async () => {
    await page('html/v2/zh/guide/index.html', 1000);
    const report = await createBuildReport({
      rootPath: directory,
      environments: { node: environment(path.join(directory, 'html')) },
      routes: routes('/v2/zh/guide/'),
    });

    expect(report).toContain('v2/');
    expect(report).toContain('zh/');
    expect(report).toContain('guide/');
    expect(report).toContain('1.0 kB');
  });

  it('omits missing pages instead of reporting stale route metadata as zero', async () => {
    expect(
      await createBuildReport({
        rootPath: directory,
        environments: { web: environment('client') },
        routes: routes('/', '/missing'),
      }),
    ).toBe('');
  });
});
