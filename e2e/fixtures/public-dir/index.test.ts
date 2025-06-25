import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  getPort,
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
    const appDir = __dirname;
    await runBuildCommand(appDir);

    const existsImg = pathExists(
      path.resolve(appDir, 'doc_build', 'rspress-icon.png'),
    );
    expect(existsImg).toBeTruthy();

    const existsTestHtml = await pathExists(
      path.resolve(appDir, 'doc_build', 'test.html'),
    );
    expect(existsTestHtml).toBeTruthy();

    const testJsPath = path.resolve(appDir, 'doc_build', 'test.js');
    const existsTestJs = await pathExists(testJsPath);
    const testJsRaw = await readFile(testJsPath, 'utf-8');
    expect(existsTestJs).toBeTruthy();
    expect(testJsRaw.startsWith("console.log('test.js');")).toBeTruthy();

    const existsTestMDX = await pathExists(
      path.resolve(appDir, 'doc_build', 'test.mdx'),
    );
    expect(existsTestMDX).toBeTruthy();
  });

  test('should load public dir img successfully under "rspress build && rspress preview"', async ({
    page,
  }) => {
    const appDir = __dirname;
    const appPort = await getPort();
    await runBuildCommand(appDir);
    await runPreviewCommand(appDir, appPort);
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

    const img = await page.$('.rspress-doc img');
    const src = await img?.getAttribute('src');
    expect(src).toEqual('/base/rspress-icon.png');
  });

  test('should load public dir img successfully under "rspress dev"', async ({
    page,
  }) => {
    const appDir = __dirname;
    const appPort = await getPort();
    await runDevCommand(appDir, appPort);
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

    const img = await page.$('.rspress-doc img');
    const src = await img?.getAttribute('src');
    expect(src).toEqual('/base/rspress-icon.png');
  });
});
