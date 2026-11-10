import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
} from '../../utils/runCommands';

function getPackageVersion(name: string) {
  const pkgJsonPath = path.join(
    import.meta.dirname,
    'node_modules',
    name,
    'package.json',
  );
  return JSON.parse(readFileSync(pkgJsonPath, 'utf-8')).version as string;
}

test.describe('React 18 development', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Hello world');
    const body = page.locator('body');
    await expect(body).toContainText(
      `react-router-dom ${getPackageVersion('react-router-dom')}`,
    );
    await expect(body).toContainText(`react ${getPackageVersion('react')}`);
  });

  test('404 page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/404`, {
      waitUntil: 'networkidle',
    });
    // find the 404 text in the page
    await expect(page.locator('body')).toContainText('404');
  });

  test('BrowserOnly should render and update sync and async children', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('#browser-only-sync-content')).toHaveText(
      'Sync 0 /',
    );
    await expect(page.locator('#browser-only-async-content')).toHaveText(
      'Async 0',
    );

    await page.locator('#browser-only-increment').click();
    await expect(page.locator('#browser-only-sync-content')).toHaveText(
      'Sync 1 /',
    );
    await expect(page.locator('#browser-only-async-content')).toHaveText(
      'Async 1',
    );
    expect(errors).toEqual([]);
  });
});

test('React 18 build should generate Markdown by default', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir);

  const docBuildDir = path.join(appDir, 'doc_build');
  const indexHtml = readFileSync(path.join(docBuildDir, 'index.md'), 'utf-8');

  const reactVersion = getPackageVersion('react');
  const routerVersion = getPackageVersion('react-router-dom');

  // Verify SSG-MD rendered correctly with React 18 (versions should be resolved, not raw {version})
  expect(indexHtml).toContain(`react ${reactVersion}`);
  expect(indexHtml).toContain(`react-router-dom ${routerVersion}`);

  expect(indexHtml).not.toContain('{reactVersion}');
  expect(indexHtml).not.toContain('{version}');
  expect(indexHtml).toContain('Sync fallback');
  expect(indexHtml).toContain('Async fallback');
  expect(indexHtml).not.toContain('Sync 0');
  expect(indexHtml).not.toContain('Async 0');
  expect(existsSync(path.join(docBuildDir, 'llms.txt'))).toBe(true);
  expect(
    readFileSync(path.join(docBuildDir, 'llms-full.txt'), 'utf-8'),
  ).toContain(`react ${reactVersion}`);
});
