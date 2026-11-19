import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createRsbuild,
  type RsbuildInstance,
  type Rspack,
} from '@rsbuild/core';
import type { RouteMeta } from '@rspress/core';
import { expect, test } from '@rstest/core';
import { pluginPlayground } from '../src/cli';

const require = createRequire(import.meta.url);

test('keeps playground imports available after another compiler closes', async () => {
  const root = await mkdtemp(
    path.join(import.meta.dirname, '.virtual-module-'),
  );
  const compilers: Awaited<ReturnType<RsbuildInstance['createCompiler']>>[] =
    [];
  const entryPath = path.join(root, 'entry.js');
  const docPath = path.join(root, 'index.mdx');

  await writeFile(
    entryPath,
    `import getImport, { imports } from '_rspress_playground_imports';
export const importNames = [...imports.keys()];
export const createElement = getImport('react').createElement;
export const renderToString = getImport('renderer').renderToString;`,
  );
  await writeFile(
    docPath,
    "```jsx playground\nimport React from 'react';\nexport default () => <div />;\n```",
  );

  async function createCompiler(name: string) {
    const plugin = pluginPlayground({
      include: [['renderer', 'react-dom/server']],
    });
    await plugin.routeGenerated!(
      [{ absolutePath: docPath } as RouteMeta],
      false,
    );
    const rsbuild = await createRsbuild({
      cwd: root,
      config: {
        ...plugin.builderConfig,
        mode: 'development',
        source: { entry: { index: entryPath } },
        resolve: {
          alias: {
            react$: require.resolve('react'),
            'react-dom/server$': require.resolve('react-dom/server'),
          },
        },
        output: {
          target: 'node',
          module: false,
          distPath: { root: path.join(root, name) },
          filename: { js: 'index.cjs' },
          minify: false,
        },
        performance: { printFileSize: false },
        tools: {
          htmlPlugin: false,
          rspack: {
            ...plugin.builderConfig?.tools?.rspack,
            output: { library: { type: 'commonjs2' } },
          },
        },
      },
    });
    const compiler = await rsbuild.createCompiler();
    compilers.push(compiler);
    return compiler;
  }

  async function compile(
    compiler: Awaited<ReturnType<RsbuildInstance['createCompiler']>>,
  ) {
    const stats = await new Promise<Rspack.Stats | Rspack.MultiStats>(
      (resolve, reject) => {
        compiler.run((error, stats) => {
          if (error || !stats) {
            reject(error ?? new Error('Expected compilation stats'));
          } else {
            resolve(stats);
          }
        });
      },
    );
    expect(stats.toJson({ all: false, errors: true }).errors).toEqual([]);
  }

  try {
    const previousCompiler = await createCompiler('previous');
    await compile(previousCompiler);
    const currentCompiler = await createCompiler('current');
    await new Promise<void>((resolve, reject) => {
      previousCompiler.close(error => (error ? reject(error) : resolve()));
    });
    compilers.shift();

    await compile(currentCompiler);
    const result = require(path.join(root, 'current/index.cjs'));
    expect(result.importNames).toEqual(['react', 'renderer']);
    expect(
      result.renderToString(result.createElement('div', null, 'works')),
    ).toBe('<div>works</div>');
  } finally {
    for (const compiler of compilers) {
      await new Promise<void>((resolve, reject) => {
        compiler.close(error => (error ? reject(error) : resolve()));
      });
    }
    await rm(root, { recursive: true, force: true });
  }
});
