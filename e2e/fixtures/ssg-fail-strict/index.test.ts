import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

test('ssg-fail-strict test', async () => {
  const appDir = import.meta.dirname;
  try {
    await runBuildCommand(appDir);
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
  }
});

test('csr should be successful', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir, 'rspress-csr.config.ts');

  const [indexHtml, componentHtml, notFoundHtml] = await Promise.all([
    readFile(path.join(appDir, 'doc_build/index.html'), 'utf-8'),
    readFile(path.join(appDir, 'doc_build/Component.html'), 'utf-8'),
    readFile(path.join(appDir, 'doc_build/404.html'), 'utf-8'),
  ]);

  expect(indexHtml).toMatch(
    /<link rel="preload" href="\/static\/js\/async\/route-[a-f0-9]{12}\..+\.js" as="script">/,
  );
  expect(componentHtml).toMatch(
    /<link rel="preload" href="\/static\/js\/async\/route-[a-f0-9]{12}\..+\.js" as="script">/,
  );
  expect(notFoundHtml).not.toContain('<link rel="preload"');
});
