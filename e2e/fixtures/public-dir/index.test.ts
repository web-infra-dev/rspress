import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getTestOutDir } from '../../utils/getTestOutDir';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test.describe('basic test', async () => {
  test('should not generate the routes for html/js/mdx files in publicDir', async () => {
    const appDir = import.meta.dirname;
    const outDir = path.resolve(appDir, getTestOutDir());
    await runBuildCommand(appDir);

    const existsImg = pathExists(path.resolve(outDir, 'rspress-icon.png'));
    expect(existsImg).toBeTruthy();

    const existsTestHtml = await pathExists(path.resolve(outDir, 'test.html'));
    expect(existsTestHtml).toBeTruthy();

    const testJsPath = path.resolve(outDir, 'test.js');
    const existsTestJs = await pathExists(testJsPath);
    const testJsRaw = await readFile(testJsPath, 'utf-8');
    expect(existsTestJs).toBeTruthy();
    expect(testJsRaw.startsWith("console.log('test.js');")).toBeTruthy();

    const existsTestMDX = await pathExists(path.resolve(outDir, 'test.mdx'));
    expect(existsTestMDX).toBeTruthy();
  });

  test('should load public dir img successfully under "rspress build && rspress preview"', async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    const appPort = await getPort();
    await runBuildCommand(appDir);
    const app = await runPreviewCommand(appDir, appPort);

    try {
      await page.goto(`http://localhost:${appPort}/base/`, {
        waitUntil: 'networkidle',
      });

      const img = page.locator('.rspress-doc img');
      await expect(img).toHaveAttribute('src', '/base/rspress-icon.png');
    } finally {
      await killProcess(app);
    }
  });

  test('should load public dir img successfully under "rspress dev"', async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    const appPort = await getPort();
    const app = await runDevCommand(appDir, appPort);

    try {
      await page.goto(`http://localhost:${appPort}/base/`, {
        waitUntil: 'networkidle',
      });

      const img = page.locator('.rspress-doc img');
      await expect(img).toHaveAttribute('src', '/base/rspress-icon.png');
    } finally {
      await killProcess(app);
    }
  });
});
