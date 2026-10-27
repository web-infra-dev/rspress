import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('site with base path', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    // Verify that the current route chunk preload respects the configured base.
    await expect(
      page.locator('link[rel="preload"][as="script"]'),
    ).toHaveAttribute(
      'href',
      /^\/base\/static\/js\/async\/route-[a-f0-9]{12}\..+\.js$/,
    );
    // take the sidebar
    const sidebar = page.locator('.rp-doc-layout__sidebar');
    await expect(sidebar).toHaveCount(1);
    // get the section
  });

  test('Should goto correct link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    const a = page.locator('.rspress-doc a:not(.rp-header-anchor)');
    // extract the href of a tag
    const href = await a.getAttribute('href');
    expect(href).toBe('/base/en/guide/install');
  });

  test('Should render the homepage - "/base"', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base`, {
      waitUntil: 'networkidle',
    });
    const docContent = page.locator('.rspress-doc');
    await expect(docContent).toContainText('This is the index page');
  });

  test('Should render the homepage - "/base/"', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });
    const docContent = page.locator('.rspress-doc');
    await expect(docContent).toContainText('This is the index page');
  });

  test('BrowserOnly should render fallback and update client content', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (/hydrate|hydration|Minified React error/i.test(message.text())) {
        errors.push(message.text());
      }
    });

    await page.goto(`http://localhost:${appPort}/base/en/`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('#browser-only-async-fallback')).toHaveText(
      'Async fallback initial',
    );
    await expect(page.locator('#browser-only-sync-content')).toHaveText(
      'Sync 0',
    );
    await expect(page.locator('#browser-only-sync-content')).toHaveAttribute(
      'data-path',
      '/base/en/',
    );

    await page.locator('#browser-only-sync-increment').click();
    await expect(page.locator('#browser-only-sync-content')).toHaveText(
      'Sync 1',
    );
    await page.locator('#browser-only-mount').click();
    await expect(page.locator('#browser-only-mount-observation')).toHaveText(
      'Mounted immediately',
    );

    await page.locator('#browser-only-async-resolve').click();
    await expect(page.locator('#browser-only-async-content')).toHaveText(
      'Async initial',
    );

    await page.locator('#browser-only-async-update').click();
    await expect(page.locator('#browser-only-async-fallback')).toHaveText(
      'Async fallback updated',
    );
    await page.locator('#browser-only-async-resolve').click();
    await expect(page.locator('#browser-only-async-content')).toHaveText(
      'Async updated',
    );
    expect(errors).toEqual([]);
  });

  test('BrowserOnly should keep suspended content inside its own boundary', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/base/en/`, {
      waitUntil: 'networkidle',
    });

    await page.locator('#browser-only-load-lazy').click();
    await expect(page.locator('#browser-only-lazy-fallback')).toBeVisible();
    await expect(page.locator('#browser-only-sibling')).toBeVisible();
    await expect(page.locator('#browser-only-parent-fallback')).toHaveCount(0);

    await page.evaluate(() => {
      window.dispatchEvent(new Event('browser-only-resolve-lazy'));
    });
    await expect(page.locator('#browser-only-lazy-content')).toHaveText(
      'Loaded',
    );
    await expect(page.locator('#browser-only-lazy-fallback')).toHaveCount(0);
    await expect(page.locator('#browser-only-sibling')).toBeVisible();
  });

  test('BrowserOnly should ignore a stale async result', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/en/`, {
      waitUntil: 'networkidle',
    });

    await page.locator('#browser-only-next-request').click();
    await expect(page.locator('#browser-only-race-fallback')).toHaveText(
      'Pending second',
    );
    await page.locator('#browser-only-resolve-second').click();
    await expect(page.locator('#browser-only-race-content')).toHaveText(
      'Second result',
    );

    await page.locator('#browser-only-resolve-first').click();
    await expect(page.locator('#browser-only-race-content')).toHaveText(
      'Second result',
    );
  });

  test('BrowserOnly should ignore stale errors and pass current errors to the boundary', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`http://localhost:${appPort}/base/en/`, {
      waitUntil: 'networkidle',
    });
    await page.locator('#browser-only-next-request').click();
    await expect(page.locator('#browser-only-race-fallback')).toHaveText(
      'Pending second',
    );
    await page.locator('#browser-only-reject-first').click();
    await expect(page.locator('#browser-only-race-fallback')).toHaveText(
      'Pending second',
    );
    await expect(page.locator('#browser-only-error')).toHaveCount(0);

    await page.locator('#browser-only-reject-second').click();
    await expect(page.locator('#browser-only-error')).toHaveText(
      'Current request failed',
    );
    expect(errors).toEqual([]);
  });

  test('BrowserOnly fallbacks should preserve surrounding HTML and Markdown', async () => {
    const docBuildDir = path.join(import.meta.dirname, 'doc_build');
    const [html, englishMarkdown, chineseMarkdown] = await Promise.all([
      readFile(path.join(docBuildDir, 'en/index.html'), 'utf-8'),
      readFile(path.join(docBuildDir, 'en/index.md'), 'utf-8'),
      readFile(path.join(docBuildDir, 'index.md'), 'utf-8'),
    ]);

    expect(html).toContain('id="browser-only-sync-fallback"');
    expect(html).toContain('id="browser-only-async-fallback"');
    expect(html).not.toContain('id="browser-only-sync-content"');
    expect(html).not.toContain('id="browser-only-async-content"');
    expect(englishMarkdown).toContain('# Index');
    expect(englishMarkdown).toContain('to go to guide');
    expect(englishMarkdown).toContain('Sync fallback');
    expect(englishMarkdown).toContain('Async fallback initial');
    expect(englishMarkdown).not.toContain('This is the index page');
    expect(englishMarkdown).not.toContain('Something went wrong');
    expect(chineseMarkdown).toContain('# 首页');
    expect(chineseMarkdown).toContain('跳往指南');
    expect(chineseMarkdown).not.toContain('This is the index page');
  });
});

test('Should resolve an auto asset prefix for route preload', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir, 'rspress-auto-asset-prefix.config.ts');

  const [rootHtml, nestedHtml] = await Promise.all([
    readFile(path.join(appDir, 'doc_build_auto/index.html'), 'utf-8'),
    readFile(
      path.join(appDir, 'doc_build_auto/en/guide/quick-start.html'),
      'utf-8',
    ),
  ]);

  expect(rootHtml).toMatch(
    /<link rel="preload" href="static\/js\/async\/route-[a-f0-9]{12}\..+\.js" as="script">/,
  );
  expect(nestedHtml).toMatch(
    /<link rel="preload" href="\.\.\/\.\.\/static\/js\/async\/route-[a-f0-9]{12}\..+\.js" as="script">/,
  );
});
