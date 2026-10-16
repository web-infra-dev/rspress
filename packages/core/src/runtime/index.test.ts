import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { afterEach, beforeEach, expect, it } from '@rstest/core';

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'rspress-runtime-'));
  await writeFile(
    path.join(directory, 'entry.js'),
    `import { PageContext, usePage } from '@rspress/core/runtime';
console.log(PageContext, usePage);`,
  );
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

it.each(['development', 'production'] as const)(
  'bundles page context exports without Rspress virtual modules in %s',
  async mode => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        mode,
        logLevel: 'silent',
        source: {
          entry: { index: path.join(directory, 'entry.js') },
          define: { 'import.meta.env': '{}' },
        },
        resolve: {
          alias: {
            '@rspress/core/runtime': path.join(__dirname, 'index.ts'),
          },
        },
        output: { distPath: { root: path.join(directory, 'dist') } },
      },
    });

    await expect(rsbuild.build()).resolves.toBeDefined();
  },
);
