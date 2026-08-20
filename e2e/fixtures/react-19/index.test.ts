import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test } from '@playwright/test';
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

function getDefaultRouterVersion() {
  const require = createRequire(
    path.join(import.meta.dirname, 'node_modules/@rspress/core/package.json'),
  );
  const pkgJsonPath = require.resolve('react-router/package.json');
  return JSON.parse(readFileSync(pkgJsonPath, 'utf-8')).version as string;
}

test.describe('React 19 with default React Router test', async () => {
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
    const routerVersion = getDefaultRouterVersion();
    expect(routerVersion).toMatch(/^8\./);
    await expect(body).toContainText(`react-router ${routerVersion}`);
    await expect(body).toContainText(`react ${getPackageVersion('react')}`);
  });

  test('404 page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/404`, {
      waitUntil: 'networkidle',
    });
    // find the 404 text in the page
    await expect(page.locator('body')).toContainText('404');
  });
});

test('React 19 with default React Router build should be successful', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir);

  const indexHtml = readFileSync(
    path.join(appDir, 'doc_build/index.html'),
    'utf-8',
  );
  expect(indexHtml).toContain(
    `react-router <!-- -->${getDefaultRouterVersion()}`,
  );
});
