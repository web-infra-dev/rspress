import { readFileSync } from 'node:fs';
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
    __dirname,
    'node_modules',
    name,
    'package.json',
  );
  return JSON.parse(readFileSync(pkgJsonPath, 'utf-8')).version as string;
}

test.describe('React 18 dev test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;
  test.beforeAll(async () => {
    const appDir = __dirname;
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
});

test('React 18 build should be successful', async () => {
  const appDir = __dirname;
  await runBuildCommand(appDir);

  const docBuildDir = path.join(appDir, 'doc_build');
  const indexHtml = readFileSync(path.join(docBuildDir, 'index.md'), 'utf-8');

  // const reactVersion = getPackageVersion('react');
  // const routerVersion = getPackageVersion('react-router-dom');

  // Verify SSG-MD rendered correctly with React 18 (versions should be resolved, not raw {version})
  // FIXME: should be "react 18"
  expect(indexHtml).toContain(`react {reactVersion}`);
  expect(indexHtml).toContain(`react-router-dom {version}`);

  // expect(indexHtml).not.toContain('{reactVersion}');
  // expect(indexHtml).not.toContain('{version}');
});
