import { expect, test } from '@playwright/test';
import path from 'node:path';
import { runBuildCommand } from '../utils/runCommands';
import { exists } from 'fs-extra';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('basic test', async () => {
  test('check the ', async () => {
    const appDir = path.join(fixtureDir, 'public-dir');
    await runBuildCommand(appDir);

    const existsImg = exists(
      path.resolve(appDir, 'doc_build', 'rspress-icon.png'),
    );
    expect(existsImg).toBeTruthy();

    const existsTestHtml = exists(
      path.resolve(appDir, 'doc_build', 'test.html'),
    );
    expect(existsTestHtml).toBeTruthy();

    const existsTestJS = exists(path.resolve(appDir, 'doc_build', 'test.js'));
    expect(existsTestJS).toBeTruthy();

    const existsTestMDX = exists(path.resolve(appDir, 'doc_build', 'test.js'));
    expect(existsTestMDX).toBeTruthy();
  });
});
