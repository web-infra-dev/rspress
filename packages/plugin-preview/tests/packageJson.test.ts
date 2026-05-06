import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from '@rstest/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginPreviewDir = path.resolve(__dirname, '..');
const coreDir = path.resolve(pluginPreviewDir, '../core');

async function readPackageJson(packageDir: string) {
  return JSON.parse(
    await readFile(path.join(packageDir, 'package.json'), 'utf8'),
  ) as {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
}

describe('plugin-preview package metadata', () => {
  test('supports react-router-dom v6 while remaining compatible with core', async () => {
    const pluginPreviewPackageJson = await readPackageJson(pluginPreviewDir);
    const corePackageJson = await readPackageJson(coreDir);

    expect(
      pluginPreviewPackageJson.peerDependencies?.['react-router-dom'],
    ).toBe(`^6 || ${corePackageJson.dependencies?.['react-router-dom']}`);
  });
});
