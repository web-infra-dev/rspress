import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

const appDir = __dirname;

test('title suffix', async () => {
  await runBuildCommand(appDir);
  expect(
    (
      await readFile(path.join(appDir, 'doc_build/index.html'), 'utf-8')
    ).includes('<title>Default Title - Index Suffix</title>'),
  ).toBeTruthy();

  expect(
    (await readFile(path.join(appDir, 'doc_build/foo.html'), 'utf-8')).includes(
      '<title>Foo | Foo Suffix</title>',
    ),
  ).toBeTruthy();
});
