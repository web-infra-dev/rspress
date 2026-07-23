import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('plugin test', async () => {
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

    const group = sidebar.locator('.rp-sidebar-group').first();
    await expect(group.locator('.rp-sidebar-item__icon')).toHaveText('📚');

    const quickStartItem = sidebar.locator(
      'a[href="/base/en/guide/quick-start.html"]',
    );
    const icon = quickStartItem.locator('.rp-sidebar-item__icon');
    const tag = quickStartItem.locator('.rp-sidebar-item__right .rp-badge');
    await expect(icon.locator('svg')).toHaveCount(1);
    await expect(tag).toHaveText('new');
    await expect(
      quickStartItem.evaluate(item => {
        const iconElement = item.querySelector('.rp-sidebar-item__icon');
        const textElement = item.querySelector(
          '.rp-sidebar-item__left > .rp-doc',
        );
        return Boolean(
          iconElement &&
          textElement &&
          (iconElement.compareDocumentPosition(textElement) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
            0,
        );
      }),
    ).resolves.toBe(true);

    const groupItems = group.locator('xpath=following-sibling::div[1]');
    await expect(groupItems).toHaveCSS('grid-template-rows', /\d+px/);
    await group.click();
    await expect(groupItems).toHaveCSS('grid-template-rows', '0px');
    await group.click();
    await expect(groupItems).toHaveCSS('grid-template-rows', /\d+px/);
  });

  test('Should goto correct link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    const a = page.locator('.rspress-doc a:not(.rp-header-anchor)');
    // extract the href of a tag
    const href = await a.getAttribute('href');
    expect(href).toBe('/base/en/guide/install.html');
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
    await page.goto(`http://localhost:${appPort}/base/en/`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('#browser-only-async-fallback')).toHaveText(
      'Async fallback initial',
    );
    await expect(page.locator('#browser-only-sync-content')).toHaveText(
      'Sync 0',
    );

    await page.locator('#browser-only-sync-increment').click();
    await expect(page.locator('#browser-only-sync-content')).toHaveText(
      'Sync 1',
    );

    await expect(page.locator('#browser-only-async-content')).toHaveText(
      'Async initial',
    );

    await page.locator('#browser-only-async-update').click();
    await expect(page.locator('#browser-only-async-fallback')).toHaveText(
      'Async fallback updated',
    );
    await expect(page.locator('#browser-only-async-content')).toHaveText(
      'Async updated',
    );
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
