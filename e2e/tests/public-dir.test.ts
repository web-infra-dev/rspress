import path from 'node:path';
import { expect, test } from '@playwright/test';
import { exists, readFile } from 'fs-extra';
import { runBuildCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('basic test', async () => {
  test('should not generate the routes for html/js/mdx files in publicDir', async () => {
    const appDir = path.join(fixtureDir, 'public-dir');
    await runBuildCommand(appDir);

    const existsImg = exists(
      path.resolve(appDir, 'doc_build', 'rspress-icon.png'),
    );
    expect(existsImg).toBeTruthy();

    const existsTestHtml = await exists(
      path.resolve(appDir, 'doc_build', 'test.html'),
    );
    expect(existsTestHtml).toBeTruthy();

    const testJsPath = path.resolve(appDir, 'doc_build', 'test.js');
    const existsTestJs = await exists(testJsPath);
    const testJsRaw = await readFile(testJsPath, 'utf-8');
    expect(existsTestJs).toBeTruthy();
    expect(testJsRaw.startsWith("console.log('test.js');")).toBeTruthy();

    const existsTestMDX = await exists(
      path.resolve(appDir, 'doc_build', 'test.mdx'),
    );
    expect(existsTestMDX).toBeTruthy();
  });
});
