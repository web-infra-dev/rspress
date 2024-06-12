import path from 'node:path';
import { test, expect } from '@playwright/test';
import { runBuildCommand } from '../utils/runCommands';
import { readFileSync } from 'fs-extra';

const appDir = path.resolve(__dirname, '../fixtures/title-suffix');

test('title suffix', async () => {
  await runBuildCommand(appDir);

  expect(
    readFileSync(path.join(appDir, 'doc_build/index.html'), 'utf-8').includes(
      '<title data-rh="true">Default Title - Index Suffix</title>',
    ),
  ).toBeTruthy();

  expect(
    readFileSync(path.join(appDir, 'doc_build/foo.html'), 'utf-8').includes(
      '<title data-rh="true">Foo | Foo Suffix</title>',
    ),
  ).toBeTruthy();
});
