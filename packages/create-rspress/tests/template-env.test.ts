import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from '@rstest/core';
import { parseConfigFileTextToJson } from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateCommonDir = path.resolve(__dirname, '../template-common');
const templateCustomThemeDir = path.resolve(
  __dirname,
  '../template-custom-theme',
);

describe('create-rspress template env types', () => {
  test('keeps the generated tsconfig scoped to docs, theme and rspress config', async () => {
    const tsconfigPath = path.join(templateCommonDir, 'tsconfig.json');
    const tsconfig = await readFile(tsconfigPath, 'utf8');
    const parsedTsconfig = parseConfigFileTextToJson(tsconfigPath, tsconfig);
    const tsconfigJson = parsedTsconfig.config as { include?: string[] };

    expect(tsconfigJson.include).toEqual([
      'docs',
      'theme',
      'rspress.config.ts',
    ]);
  });

  test('declares CSS and SSG_MD ambient types in the custom theme folder', async () => {
    const envDtsPath = path.join(templateCustomThemeDir, 'theme/env.d.ts');
    const content = await readFile(envDtsPath, 'utf8');

    expect(content).toContain("declare module '*.css';");
    expect(content).toContain('interface ImportMetaEnv');
    expect(content).toContain('readonly SSG_MD: boolean;');
    expect(content).toContain('interface ImportMeta');
    expect(content).toContain('readonly env: ImportMetaEnv;');
  });
});
