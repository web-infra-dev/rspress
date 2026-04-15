import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from '@rstest/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateCommonDir = path.resolve(__dirname, '../template-common');

describe('create-rspress template env types', () => {
  test('includes env.d.ts in the generated tsconfig', async () => {
    const tsconfigPath = path.join(templateCommonDir, 'tsconfig.json');
    const tsconfig = await readFile(tsconfigPath, 'utf8');

    expect(tsconfig).toContain(
      '"include": ["docs", "theme", "rspress.config.ts", "env.d.ts"]',
    );
  });

  test('declares CSS and SSG_MD ambient types', async () => {
    const envDtsPath = path.join(templateCommonDir, 'env.d.ts');
    const content = await readFile(envDtsPath, 'utf8');

    expect(content).toContain("declare module '*.css';");
    expect(content).toContain('interface ImportMetaEnv');
    expect(content).toContain('readonly SSG_MD: boolean;');
    expect(content).toContain('interface ImportMeta');
    expect(content).toContain('readonly env: ImportMetaEnv;');
  });
});
