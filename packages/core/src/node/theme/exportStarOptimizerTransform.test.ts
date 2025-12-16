import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { exportStarOptimizerTransform } from './exportStarOptimizerTransform';

const fixturesRoot = path.join(__dirname, 'fixtures');

async function loadFixture(caseName: string) {
  const filePath = path.join(fixturesRoot, caseName, 'index.ts');
  const code = await readFile(filePath, 'utf-8');
  return { code, filePath };
}

describe('exportStarOptimizerTransform', () => {
  it('replaces export * with named exports, excluding locals', async () => {
    const { code, filePath } = await loadFixture('basic');
    const result = await exportStarOptimizerTransform(code, filePath);

    expect(result).toMatchInlineSnapshot(`
"export const A = 1;\nexport { Button, Other, default } from './foo';\n"
`);
  });

  it('removes export * when module exports are already local', async () => {
    const { code, filePath } = await loadFixture('local-only');
    const result = await exportStarOptimizerTransform(code, filePath);

    expect(result).toMatchInlineSnapshot(`
      "export const A = 1;

      "
    `);
  });

  it('resolves index fallback when no direct file match', async () => {
    const { code, filePath } = await loadFixture('index-fallback');
    const result = await exportStarOptimizerTransform(code, filePath);

    expect(result).toMatchInlineSnapshot(`
"export { B } from './foo';\n"
`);
  });
});
