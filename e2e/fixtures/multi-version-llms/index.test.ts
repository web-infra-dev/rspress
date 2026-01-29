import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

const appDir = __dirname;
const docBuildDir = path.join(appDir, 'doc_build');

async function expectFileExists(filePath: string) {
  const stat = await fs.stat(filePath);
  expect(stat.isFile()).toBe(true);
  expect(stat.size).toBeGreaterThan(0);
}

// Expected files for multi-version (v1 default, v2 non-default) + multi-lang (en default, zh non-default):
// Default version (v1) + default lang (en): llms.txt, llms-full.txt
// Default version (v1) + non-default lang (zh): zh/llms.txt, zh/llms-full.txt
// Non-default version (v2) + default lang (en): v2/llms.txt, v2/llms-full.txt
// Non-default version (v2) + non-default lang (zh): v2/zh/llms.txt, v2/zh/llms-full.txt

const expectedFiles = [
  'llms.txt',
  'llms-full.txt',
  'zh/llms.txt',
  'zh/llms-full.txt',
  'v2/llms.txt',
  'v2/llms-full.txt',
  'v2/zh/llms.txt',
  'v2/zh/llms-full.txt',
];

test.describe('multi-version + multi-lang llms (SSG-MD)', () => {
  test('should generate llms files for all version+lang combinations', async () => {
    await runBuildCommand(appDir);

    for (const file of expectedFiles) {
      await expectFileExists(path.join(docBuildDir, file));
    }
  });
});

test.describe('multi-version + multi-lang llms (plugin-llms)', () => {
  test('should generate llms files for all version+lang combinations', async () => {
    await runBuildCommand(appDir, 'rspress-plugin-llms.config.ts');

    for (const file of expectedFiles) {
      await expectFileExists(path.join(docBuildDir, file));
    }
  });
});
