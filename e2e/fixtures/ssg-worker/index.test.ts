import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

test('build with experimental SSG worker', async () => {
  const appDir = import.meta.dirname;
  const docBuildDir = path.join(appDir, 'doc_build');
  await runBuildCommand(appDir);

  const indexHtmlPath = path.join(docBuildDir, 'index.html');
  const notFoundHtmlPath = path.join(docBuildDir, '404.html');

  await Promise.all([access(indexHtmlPath), access(notFoundHtmlPath)]);

  const indexHtml = await readFile(indexHtmlPath, 'utf-8');
  expect(indexHtml).toContain('<title>SSG worker</title>');
  expect(indexHtml).toContain('id="ssg-worker"');
  expect(indexHtml).toContain(
    '<p>This page is rendered by the experimental SSG worker.</p>',
  );

  const notFoundHtml = await readFile(notFoundHtmlPath, 'utf-8');
  expect(notFoundHtml).toContain('<title>404</title>');
  expect(notFoundHtml).toContain('PAGE NOT FOUND');

  const staticFiles = await readdir(path.join(docBuildDir, 'static'), {
    recursive: true,
  });
  expect(
    staticFiles.some(
      file =>
        typeof file === 'string' &&
        file.startsWith('search_index.en.') &&
        file.endsWith('.json'),
    ),
  ).toBe(true);
  expect(await pathExists(path.join(docBuildDir, '__ssg__'))).toBe(false);
});
