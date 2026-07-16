import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

test('llms should be successful', async () => {
  const appDir = import.meta.dirname;
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

  const llmsFullTxt = await fs.readFile(
    path.join(docBuildDir, 'llms-full.txt'),
    'utf-8',
  );
  expect(llmsFullTxt).toContain('url: https://example.com/docs/index.md');

  const llmsTxt = await fs.readFile(
    path.join(docBuildDir, 'llms.txt'),
    'utf-8',
  );
  expect(llmsTxt).toContain('# Rspress SSG MDX Test');
  expect(llmsTxt).toContain('## Others');
  expect(llmsTxt).toContain(
    '- [MDX and React components](https://example.com/docs/components.md)',
  );
});

test('custom llms.txt renderer should be successful', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir, 'rspress-custom-llms-txt.config.ts');

  const llmsTxt = await fs.readFile(
    path.join(appDir, 'doc_build', 'llms.txt'),
    'utf-8',
  );
  expect(llmsTxt).toContain('# Custom Rspress SSG MDX Test');
  expect(llmsTxt).toContain('> Rspress SSG MDX Test Description');
  expect(llmsTxt).toContain('- Language: en');
  expect(llmsTxt).toContain('- Version: default');
  expect(llmsTxt).toContain('- Base: /docs/');
  expect(llmsTxt).toContain('- Site origin: https://example.com');
  expect(llmsTxt).toContain('## Docs');
  expect(llmsTxt).toContain(
    '- [MDX and React components](https://example.com/docs/components.md) (/components, en, default)',
  );
});

test('csr should be successful', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir, 'rspress-csr.config.ts');
});
