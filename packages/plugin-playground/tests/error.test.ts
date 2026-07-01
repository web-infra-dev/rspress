import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test } from '@rstest/core';
import { pluginPlayground } from '../src/cli';

describe('plugin-playground errors', () => {
  test('should include source file path when mdx parsing fails', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'rspress-playground-'));
    const filepath = path.join(tempDir, 'index.mdx');

    await writeFile(filepath, '## Test {#base}', 'utf-8');

    try {
      const plugin = pluginPlayground();
      if (!plugin.routeGenerated) {
        throw new Error('Expected playground plugin to expose routeGenerated');
      }

      await expect(
        plugin.routeGenerated([
          {
            absolutePath: filepath,
            routePath: '/',
            relativePath: 'index.mdx',
            pageName: 'index',
            lang: '',
            version: '',
          },
        ]),
      ).rejects.toThrow(
        `[Playground]: Failed to parse ${filepath}.\nCould not parse expression with acorn`,
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
