import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

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
    const appDir = path.join(fixtureDir, 'public-dir');
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
});
