import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

test('llms should be successful', async () => {
  const appDir = __dirname;
  await runBuildCommand(appDir);

  const docBuildDir = path.join(appDir, 'doc_build');
  const files = ['llms.txt', 'index.md', 'components.md', 'llms-full.txt'];

  for (const file of files) {
    const filePath = path.join(docBuildDir, file);
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size <= 0) {
      throw new Error(`Expected non-empty file: ${filePath}`);
    }
  }
});

test('csr should be successful', async () => {
  const appDir = __dirname;
  await runBuildCommand(appDir, 'rspress-csr.config.ts');
});
